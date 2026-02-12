import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import cheerio from 'cheerio';
import debug from 'debug';
import { URL } from 'url';

const log = debug('page-loader');
const logNetwork = debug('page-loader:network');
const logFile = debug('page-loader:file');
const logHtml = debug('page-loader:html');
const logResource = debug('page-loader:resource');
const logError = debug('page-loader:error');

class PageLoaderError extends Error {
  constructor(message, code, statusCode = null) {
    super(message);
    this.name = 'PageLoaderError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

class NetworkError extends PageLoaderError {
  constructor(message, code, statusCode = null) {
    super(message, code, statusCode);
    this.name = 'NetworkError';
  }
}

class FileSystemError extends PageLoaderError {
  constructor(message, code) {
    super(message, code);
    this.name = 'FileSystemError';
  }
}

class ResourceError extends PageLoaderError {
  constructor(message, url, code, statusCode = null) {
    super(message, code, statusCode);
    this.name = 'ResourceError';
    this.resourceUrl = url;
  }
}

const generateFileName = (url) => {
  const urlWithoutProtocol = url.replace(/^https?:\/\//i, '');
  const fileName = urlWithoutProtocol.replace(/[^a-z0-9]/gi, '-');
  return fileName;
};

const generateHtmlFileName = (url) => `${generateFileName(url)}.html`;
const generateFilesDirName = (url) => `${generateFileName(url)}_files`;

const getLocalFileName = (resourceUrl, baseUrl) => {
  const fullUrl = new URL(resourceUrl, baseUrl).toString();
  const fileName = generateFileName(fullUrl);
  
  const urlObj = new URL(fullUrl);
  const pathname = urlObj.pathname;
  
  let extension;
  if (pathname === '' || pathname === '/') {
    extension = '.html';
  } else {
    extension = path.extname(pathname.split('?')[0]) || '.html';
  }
  
  return `${fileName}${extension}`;
};

const isLocalResource = (resourceUrl, pageUrl) => {
  try {
    const resourceFullUrl = new URL(resourceUrl, pageUrl);
    const pageHost = new URL(pageUrl).host;
    return resourceFullUrl.host === pageHost;
  } catch {
    return false;
  }
};

const resourceTags = [
  { selector: 'img', attribute: 'src', type: 'image' },
  { selector: 'link[rel="stylesheet"]', attribute: 'href', type: 'stylesheet' },
  { selector: 'link[rel="canonical"]', attribute: 'href', type: 'canonical' },
  { selector: 'script', attribute: 'src', type: 'script' }
];

const validateOutputDirectory = async (outputDir) => {
  logFile(`Validating output directory: ${outputDir}`);
  
  try {
    await fs.access(outputDir, fs.constants.F_OK);
  } catch {
    logError(`Output directory does not exist: ${outputDir}`);
    throw new FileSystemError(
      `Output directory does not exist: ${outputDir}`,
      'ENOENT'
    );
  }
  
  try {
    await fs.access(outputDir, fs.constants.W_OK);
  } catch {
    logError(`No write permission for output directory: ${outputDir}`);
    throw new FileSystemError(
      `No write permission for output directory: ${outputDir}`,
      'EACCES'
    );
  }
  
  try {
    const stats = await fs.stat(outputDir);
    if (!stats.isDirectory()) {
      logError(`Output path is not a directory: ${outputDir}`);
      throw new FileSystemError(
        `Output path is not a directory: ${outputDir}`,
        'ENOTDIR'
      );
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw new FileSystemError(
        `Cannot access output directory: ${error.message}`,
        error.code
      );
    }
  }
};

const downloadResource = (resourceUrl, baseUrl, outputDir) => {
  const fullUrl = new URL(resourceUrl, baseUrl).toString();
  const fileName = getLocalFileName(resourceUrl, baseUrl);
  const filePath = path.join(outputDir, fileName);
  
  logNetwork(`Downloading resource: ${fullUrl}`);
  
  return axios.get(fullUrl, { 
    responseType: 'arraybuffer',
    validateStatus: (status) => status >= 200 && status < 400,
    timeout: 10000,
    maxRedirects: 5
  })
    .then((response) => {
      logNetwork(`✓ Resource downloaded: ${fullUrl}`);
      return fs.writeFile(filePath, response.data)
        .then(() => {
          logFile(`✓ Resource saved: ${filePath}`);
          return fileName;
        })
        .catch((error) => {
          logError(`Failed to save resource ${fullUrl}: ${error.message}`);
          throw new ResourceError(
            `Failed to save resource ${fileName}: ${error.message}`,
            fullUrl,
            error.code
          );
        });
    })
    .catch((error) => {
      logError(`Failed to download resource ${fullUrl}`);
      
      if (error.response) {
        const message = `Failed to download resource (${error.response.status} ${error.response.statusText}): ${resourceUrl}`;
        throw new ResourceError(
          message,
          fullUrl,
          'HTTP_ERROR',
          error.response.status
        );
      }
      
      if (error.request) {
        let message;
        let code;
        
        if (error.code === 'ENOTFOUND') {
          message = `Failed to download resource - host not found: ${new URL(fullUrl).host}`;
          code = 'ENOTFOUND';
        } else if (error.code === 'ECONNREFUSED') {
          message = `Failed to download resource - connection refused: ${new URL(fullUrl).host}`;
          code = 'ECONNREFUSED';
        } else if (error.code === 'ETIMEDOUT') {
          message = `Failed to download resource - timeout: ${resourceUrl}`;
          code = 'ETIMEDOUT';
        } else {
          message = `Failed to download resource - network error: ${error.message}`;
          code = 'NETWORK_ERROR';
        }
        
        throw new ResourceError(message, fullUrl, code);
      }
      
      throw new ResourceError(
        `Failed to download resource: ${error.message}`,
        fullUrl,
        'UNKNOWN_ERROR'
      );
    });
};

const processHtml = (html, baseUrl, resourcesDir, outputDir) => {
  const $ = cheerio.load(html);
  const resources = [];
  const errors = [];

  resourceTags.forEach(({ selector, attribute, type }) => {
    $(selector).each((i, el) => {
      const attrValue = $(el).attr(attribute);
      if (attrValue && isLocalResource(attrValue, baseUrl)) {
        resources.push({
          url: attrValue,
          element: el,
          attribute,
          type
        });
      }
    });
  });

  if (resources.length === 0) {
    return Promise.resolve($.html());
  }

  return fs.mkdir(outputDir, { recursive: true })
    .catch((error) => {
      logError(`Failed to create resources directory: ${error.message}`);
      throw new FileSystemError(
        `Failed to create resources directory: ${error.message}`,
        error.code
      );
    })
    .then(() => {
      const downloadPromises = resources.map((resource) => {
        return downloadResource(resource.url, baseUrl, outputDir)
          .then((localFileName) => {
            const localPath = path.join(resourcesDir, localFileName);
            $(resource.element).attr(resource.attribute, localPath);
            logHtml(`✓ Updated ${resource.type} link: ${resource.url} -> ${localPath}`);
            return { success: true };
          })
          .catch((error) => {
            errors.push(error);
            logError(`✗ Failed to download ${resource.type}: ${resource.url} - ${error.message}`);
            return { success: false };
          });
      });

      return Promise.all(downloadPromises)
        .then(() => {
          const modifiedHtml = $.html();
          
          if (errors.length > 0) {
            const errorMessages = errors.map(e => `  • ${e.message}`).join('\n');
            logError(`\n⚠️  Some resources failed to download:\n${errorMessages}\n`);
          }
          
          return modifiedHtml;
        });
    });
};

const pageLoader = (url, outputDir = process.cwd()) => {
  log(`Starting page-loader for URL: ${url}`);
  
  try {
    new URL(url);
  } catch {
    logError(`Invalid URL: ${url}`);
    throw new PageLoaderError(
      `Invalid URL: ${url}. Please provide a valid URL including protocol (e.g., https://example.com)`,
      'INVALID_URL'
    );
  }
  
  return validateOutputDirectory(outputDir)
    .then(() => {
      log(`Output directory validated: ${outputDir}`);
      
      return axios.get(url, {
        validateStatus: (status) => status >= 200 && status < 400,
        timeout: 30000,
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Page-Loader/1.0.0'
        }
      });
    })
    .catch((error) => {
      if (error instanceof FileSystemError) {
        throw error;
      }
      
      if (error.response) {
        logError(`HTTP Error ${error.response.status}: ${url}`);
        throw new NetworkError(
          `Failed to load page: ${error.response.status} ${error.response.statusText}`,
          'HTTP_ERROR',
          error.response.status
        );
      }
      
      if (error.request) {
        if (error.code === 'ENOTFOUND') {
          throw new NetworkError(
            `Failed to load page - host not found: ${new URL(url).host}`,
            'ENOTFOUND'
          );
        }
        if (error.code === 'ECONNREFUSED') {
          throw new NetworkError(
            `Failed to load page - connection refused: ${new URL(url).host}`,
            'ECONNREFUSED'
          );
        }
        if (error.code === 'ETIMEDOUT') {
          throw new NetworkError(
            `Failed to load page - timeout: ${url}`,
            'ETIMEDOUT'
          );
        }
        throw new NetworkError(
          `Failed to load page: ${error.message}`,
          'NETWORK_ERROR'
        );
      }
      
      throw new NetworkError(
        `Failed to load page: ${error.message}`,
        'UNKNOWN_ERROR'
      );
    })
    .then((response) => {
      log(`✓ Page downloaded: ${url}`);
      
      const htmlFileName = generateHtmlFileName(url);
      const htmlFilePath = path.join(outputDir, htmlFileName);
      const filesDirName = generateFilesDirName(url);
      const filesDirPath = path.join(outputDir, filesDirName);
      
      return processHtml(response.data, url, filesDirName, filesDirPath)
        .then((modifiedHtml) => {
          logFile(`Saving HTML to: ${htmlFilePath}`);
          
          return fs.writeFile(htmlFilePath, modifiedHtml)
            .then(() => {
              log(`✓ Page saved: ${htmlFilePath}`);
              return htmlFilePath;
            })
            .catch((error) => {
              logError(`Failed to save HTML file: ${error.message}`);
              throw new FileSystemError(
                `Failed to save HTML file: ${error.message}`,
                error.code
              );
            });
        });
    });
};

export default pageLoader;