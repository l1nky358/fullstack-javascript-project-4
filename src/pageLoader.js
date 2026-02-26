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

const generateHtmlFileName = (url) => `${generateFileName(url)}.html`
const generateFilesDirName = (url) => `${generateFileName(url)}_files`

const getLocalFileName = (resourceUrl, baseUrl) => {
  const fullUrl = new URL(resourceUrl, baseUrl).toString()
  const urlWithoutProtocol = fullUrl.replace(/^https?:\/\//i, '')
  let fileName = urlWithoutProtocol.replace(/[^a-z0-9]/gi, '-')

  const urlObj = new URL(fullUrl)
  const pathname = urlObj.pathname

  let extension
  if (pathname === '' || pathname === '/') {
    extension = '.html'
  } else {
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
  } catch {
    return false
  }
}

const resourceTags = [
  { selector: 'img', attribute: 'src', type: 'image' },
  { selector: 'link[rel="stylesheet"]', attribute: 'href', type: 'stylesheet' },
  { selector: 'link[rel="canonical"]', attribute: 'href', type: 'canonical' },
  { selector: 'script', attribute: 'src', type: 'script' },
]

const validateOutputDirectory = async (outputDir) => {
  try {
    await fs.access(outputDir, fs.constants.F_OK)
  } catch {
    throw new FileSystemError(`Output directory does not exist: ${outputDir}`, 'ENOENT')
  }

  try {
    await fs.access(outputDir, fs.constants.W_OK)
  } catch {
    throw new FileSystemError(`No write permission for output directory: ${outputDir}`, 'EACCES')
  }

  try {
    const stats = await fs.stat(outputDir)
    if (!stats.isDirectory()) {
      throw new FileSystemError(`Output path is not a directory: ${outputDir}`, 'ENOTDIR')
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw new FileSystemError(`Cannot access output directory: ${error.message}`, error.code)
    }
  }
}

const downloadResource = async (resourceUrl, baseUrl, outputDir) => {
  const fullUrl = new URL(resourceUrl, baseUrl).toString()
  const fileName = getLocalFileName(resourceUrl, baseUrl)
  const filePath = path.join(outputDir, fileName)

  const response = await axios.get(fullUrl, {
    responseType: 'arraybuffer',
    validateStatus: (status) => status >= 200 && status < 400,
    timeout: 10000,
    maxRedirects: 5,
  })

  await fs.writeFile(filePath, response.data)
  return fileName
}

const processHtml = async (html, baseUrl, resourcesDir, outputDir) => {
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
}
