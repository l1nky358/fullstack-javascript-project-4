import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import cheerio from 'cheerio';
import debug from 'debug';
import { URL } from 'url';
import { Listr } from 'listr2';

const log = debug('page-loader');
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

const generateFileName = (url) => {
  const urlWithoutProtocol = url.replace(/^https?:\/\//i, '');
  return urlWithoutProtocol.replace(/[^a-z0-9]/gi, '-');
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
  { selector: 'img', attribute: 'src', type: '🖼️ image' },
  { selector: 'link[rel="stylesheet"]', attribute: 'href', type: '🎨 stylesheet' },
  { selector: 'link[rel="canonical"]', attribute: 'href', type: '🔗 canonical' },
  { selector: 'script', attribute: 'src', type: '📜 script' }
];

const validateOutputDirectory = async (outputDir) => {
  try {
    await fs.access(outputDir, fs.constants.F_OK);
  } catch {
    throw new FileSystemError(
      `Output directory does not exist: ${outputDir}`,
      'ENOENT'
    );
  }
  
  try {
    await fs.access(outputDir, fs.constants.W_OK);
  } catch {
    throw new FileSystemError(
      `No write permission for output directory: ${outputDir}`,
      'EACCES'
    );
  }
  
  try {
    const stats = await fs.stat(outputDir);
    if (!stats.isDirectory()) {
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

const downloadResource = async (resourceUrl, baseUrl, outputDir) => {
  const fullUrl = new URL(resourceUrl, baseUrl).toString();
  const fileName = getLocalFileName(resourceUrl, baseUrl);
  const filePath = path.join(outputDir, fileName);
  
  const response = await axios.get(fullUrl, { 
    responseType: 'arraybuffer',
    validateStatus: (status) => status >= 200 && status < 400,
    timeout: 10000,
    maxRedirects: 5
  });
  
  await fs.writeFile(filePath, response.data);
  return fileName;
};

const processHtml = async (html, baseUrl, resourcesDir, outputDir) => {
  const $ = cheerio.load(html);
  const resources = [];

  resourceTags.forEach(({ selector, attribute, type }) => {
    $(selector).each((i, el) => {
      const attrValue = $(el).attr(attribute);
      if (attrValue && isLocalResource(attrValue, baseUrl)) {
        resources.push({
          url: attrValue,
          element: el,
          attribute,
          type,
          selector
        });
      }
    });
  });

  if (resources.length === 0) {
    return $.html();
  }

  await fs.mkdir(outputDir, { recursive: true });

  const tasks = new Listr(
    [
      {
        title: `📁 Prepare resources directory`,
        task: async () => {
          await fs.mkdir(outputDir, { recursive: true });
        }
      },
      {
        title: `📦 Downloading ${resources.length} resources`,
        task: (ctx, task) => {
          const resourceTasks = resources.map((resource) => ({
            title: `${resource.type} ${path.basename(resource.url)}`,
            task: async (_, subtask) => {
              try {
                const localFileName = await downloadResource(resource.url, baseUrl, outputDir);
                const localPath = path.join(resourcesDir, localFileName);
                $(resource.element).attr(resource.attribute, localPath);
                subtask.title = `✅ ${resource.type} ${path.basename(resource.url)}`;
              } catch (error) {
                subtask.title = `❌ ${resource.type} ${path.basename(resource.url)} (${error.message})`;
                if (error.response) {
                  throw new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
                }
                throw new Error(error.message);
              }
            }
          }));

          return task.newListr(resourceTasks, { concurrent: true, exitOnError: false });
        }
      }
    ],
    { 
      concurrent: false,
      rendererOptions: { 
        clearOutput: false,
        collapse: false,
        showSubtasks: true
      }
    }
  );

  await tasks.run();
  return $.html();
};

const pageLoader = async (url, outputDir = process.cwd()) => {
  log(`Starting page-loader for URL: ${url}`);
  
  try {
    new URL(url);
  } catch {
    throw new PageLoaderError(
      `Invalid URL: ${url}. Please provide a valid URL including protocol (e.g., https://example.com)`,
      'INVALID_URL'
    );
  }
  
  await validateOutputDirectory(outputDir);
  
  const mainTasks = new Listr(
    [
      {
        title: `🌐 Loading page: ${url}`,
        task: async (ctx) => {
          const response = await axios.get(url, {
            validateStatus: (status) => status >= 200 && status < 400,
            timeout: 30000,
            maxRedirects: 5,
            headers: {
              'User-Agent': 'Page-Loader/1.0.0'
            }
          });
          ctx.html = response.data;
          ctx.url = url;
        }
      },
      {
        title: `📝 Processing HTML`,
        task: async (ctx) => {
          const htmlFileName = generateHtmlFileName(url);
          ctx.htmlFilePath = path.join(outputDir, htmlFileName);
          ctx.filesDirName = generateFilesDirName(url);
          ctx.filesDirPath = path.join(outputDir, ctx.filesDirName);
          
          ctx.modifiedHtml = await processHtml(
            ctx.html, 
            url, 
            ctx.filesDirName, 
            ctx.filesDirPath
          );
        }
      },
      {
        title: `💾 Saving HTML file`,
        task: async (ctx) => {
          await fs.writeFile(ctx.htmlFilePath, ctx.modifiedHtml);
        }
      }
    ],
    { 
      concurrent: false,
      rendererOptions: { 
        clearOutput: false,
        collapse: false,
        showSubtasks: true
      }
    }
  );

  const ctx = await mainTasks.run();
  log(`✓ Page saved: ${ctx.htmlFilePath}`);
  return ctx.htmlFilePath;
};

export default pageLoader;