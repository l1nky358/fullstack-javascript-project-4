import fs from 'fs/promises'
import path from 'path'
import axios from 'axios'
import * as cheerio from 'cheerio'
import debug from 'debug'
import { URL } from 'url'

const log = debug('page-loader')
const logError = debug('page-loader:error')

class PageLoaderError extends Error {
  constructor(message, code, statusCode = null) {
    super(message)
    this.name = 'PageLoaderError'
    this.code = code
    this.statusCode = statusCode
  }
}

class NetworkError extends PageLoaderError {
  constructor(message, code, statusCode = null) {
    super(message, code, statusCode)
    this.name = 'NetworkError'
  }
}

class FileSystemError extends PageLoaderError {
  constructor(message, code) {
    super(message, code)
    this.name = 'FileSystemError'
  }
}

const generateFileName = (url) => {
  const urlWithoutProtocol = url.replace(/^https?:\/\//i, '')
  return urlWithoutProtocol.replace(/[^a-z0-9]/gi, '-')
}

const generateHtmlFileName = url => `${generateFileName(url)}.html`
const generateFilesDirName = url => `${generateFileName(url)}_files`

const getLocalFileName = (resourceUrl, baseUrl) => {
  const fullUrl = new URL(resourceUrl, baseUrl).toString()
  const urlWithoutProtocol = fullUrl.replace(/^https?:\/\//i, '')
  let fileName = urlWithoutProtocol.replace(/[^a-z0-9]/gi, '-')

  const urlObj = new URL(fullUrl)
  const pathname = urlObj.pathname

  let extension

  if (pathname === '' || pathname === '/') {
    extension = '.html'
  }
  else {
    extension = path.extname(pathname.split('?')[0]) || '.html'
  }

  if (fileName.endsWith(extension.replace('.', '-'))) {
    fileName = fileName.slice(0, -extension.length)
  }

  return `${fileName}${extension}`
}

const isLocalResource = (resourceUrl, pageUrl) => {
  try {
    const resourceFullUrl = new URL(resourceUrl, pageUrl)
    const pageHost = new URL(pageUrl).host
    return resourceFullUrl.host === pageHost
  }
  catch {
    return false
  }
}

const resourceTags = [
  { selector: 'img', attribute: 'src', type: 'image' },
  { selector: 'link[rel="stylesheet"]', attribute: 'href', type: 'stylesheet' },
  { selector: 'link[rel="canonical"]', attribute: 'href', type: 'canonical' },
  { selector: 'script', attribute: 'src', type: 'script' },
]

const validateOutputDirectory = (outputDir) => {
  return fs.access(outputDir, fs.constants.F_OK)
    .catch(() => {
      throw new FileSystemError(`Output directory does not exist: ${outputDir}`, 'ENOENT')
    })
    .then(() => fs.access(outputDir, fs.constants.W_OK))
    .catch(() => {
      throw new FileSystemError(`No write permission for output directory: ${outputDir}`, 'EACCES')
    })
    .then(() => fs.stat(outputDir))
    .then((stats) => {
      if (!stats.isDirectory()) {
        throw new FileSystemError(`Output path is not a directory: ${outputDir}`, 'ENOTDIR')
      }
    })
    .catch((error) => {
      if (error.code !== 'ENOENT') {
        throw new FileSystemError(`Cannot access output directory: ${error.message}`, error.code)
      }
    })
}

const downloadResource = (resourceUrl, baseUrl, outputDir) => {
  const fullUrl = new URL(resourceUrl, baseUrl).toString()
  const fileName = getLocalFileName(resourceUrl, baseUrl)
  const filePath = path.join(outputDir, fileName)

  return axios.get(fullUrl, {
    responseType: 'arraybuffer',
    validateStatus: status => status >= 200 && status < 400,
    timeout: 10000,
    maxRedirects: 5,
  })
    .then(response => fs.writeFile(filePath, response.data))
    .then(() => fileName)
}

const processHtml = (html, baseUrl, resourcesDir, outputDir) => {
  const $ = cheerio.load(html)
  const resources = []

  resourceTags.forEach(({ selector, attribute, type }) => {
    $(selector).each((i, el) => {
      const attrValue = $(el).attr(attribute)
      if (attrValue && isLocalResource(attrValue, baseUrl)) {
        resources.push({
          url: attrValue,
          element: el,
          attribute,
          type,
        })
      }
    })
  })

  if (resources.length === 0) {
    return Promise.resolve($.html())
  }

  return fs.mkdir(outputDir, { recursive: true })
    .then(() => {
      const downloadPromises = resources.map((resource) => {
        return downloadResource(resource.url, baseUrl, outputDir)
          .then((localFileName) => {
            const localPath = path.join(resourcesDir, localFileName)
            $(resource.element).attr(resource.attribute, localPath)
            return { success: true, type: resource.type, url: resource.url }
          })
          .catch((error) => {
            logError(`Failed to download ${resource.type}: ${resource.url} - ${error.message}`)
            return { success: false, type: resource.type, url: resource.url }
          })
      })

      return Promise.all(downloadPromises)
        .then(() => $.html())
    })
}

const pageLoader = (url, outputDir = process.cwd()) => {
  log(`Starting page-loader for URL: ${url}`)

  let urlObj
  try {
    urlObj = new URL(url)
  }
  catch {
    return Promise.reject(new PageLoaderError(
      `Invalid URL: ${url}. Please provide a valid URL including protocol (e.g., https://example.com)`,
      'INVALID_URL',
    ))
  }

  return validateOutputDirectory(outputDir)
    .then(() => axios.get(url, {
      validateStatus: status => status >= 200 && status < 400,
      timeout: 30000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Page-Loader/1.0.0',
      },
    }))
    .catch((error) => {
      if (error.response) {
        throw new NetworkError(
          `Failed to load page: ${error.response.status} ${error.response.statusText}`,
          'HTTP_ERROR',
          error.response.status,
        )
      }
      if (error.code === 'ENOTFOUND') {
        throw new NetworkError(
          `Failed to load page - host not found: ${urlObj.host}`,
          'ENOTFOUND',
        )
      }
      if (error.code === 'ECONNREFUSED') {
        throw new NetworkError(
          `Failed to load page - connection refused: ${urlObj.host}`,
          'ECONNREFUSED',
        )
      }
      if (error.code === 'ETIMEDOUT') {
        throw new NetworkError(
          `Failed to load page - timeout: ${url}`,
          'ETIMEDOUT',
        )
      }
      throw new NetworkError(
        `Failed to load page: ${error.message}`,
        'NETWORK_ERROR',
      )
    })
    .then((response) => {
      const htmlFileName = generateHtmlFileName(url)
      const htmlFilePath = path.join(outputDir, htmlFileName)
      const filesDirName = generateFilesDirName(url)
      const filesDirPath = path.join(outputDir, filesDirName)

      return processHtml(
        response.data,
        url,
        filesDirName,
        filesDirPath,
      )
        .then(modifiedHtml => fs.writeFile(htmlFilePath, modifiedHtml))
        .then(() => {
          log(`✓ Page saved: ${htmlFilePath}`)
          return htmlFilePath
        })
    })
}

export default pageLoader
