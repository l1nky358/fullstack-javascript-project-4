Skip to content
l1nky358
fullstack-javascript-project-4
Repository navigation
Code
Issues
Pull requests
Actions
Projects
Wiki
Security
Insights
Settings
hexlet-check
Update pageLoader.js #119
All jobs
Run details
Annotations
1 error
build
failed 1 minute ago in 38s
Search logs
2s
0s
31s
Run hexlet/project-action@release
Preparing
/usr/bin/docker compose run app make setup
time="2026-02-26T10:13:19Z" level=warning msg="/var/tmp/source/docker-compose.override.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion"
 Network source_default  Creating
 Network source_default  Created
#1 [internal] load local bake definitions
#1 reading from stdin 323B done
#1 DONE 0.0s

#2 [internal] load build definition from Dockerfile
#2 transferring dockerfile: 188B done
#2 DONE 0.0s

#3 [internal] load metadata for docker.io/library/node:24-alpine
#3 DONE 0.1s

#4 [internal] load .dockerignore
#4 transferring context: 78B done
#4 DONE 0.0s

#5 [1/5] FROM docker.io/library/node:24-alpine@sha256:7fddd9ddeae8196abf4a3ef2de34e11f7b1a722119f91f28ddf1e99dcafdf114
#5 DONE 0.0s

#6 [internal] load build context
#6 transferring context: 18.11kB 0.0s done
#6 DONE 0.0s

#7 [3/5] WORKDIR /project
#7 CACHED

#8 [2/5] RUN apk add --no-cache bash make
#8 CACHED

#9 [4/5] RUN mkdir /project/code
#9 CACHED

#10 [5/5] COPY . .
#10 CACHED

#11 exporting to image
#11 exporting layers done
#11 writing image sha256:af64c82841a6576afe5813670bed59eee6e318aff32c2c1d3b71e75d18e49e5a done
#11 naming to docker.io/library/source-app done
#11 DONE 0.0s

#12 resolving provenance for metadata file
#12 DONE 0.0s
npm install
npm warn ERESOLVE overriding peer dependency
npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
npm warn deprecated glob@7.2.3: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
npm warn deprecated whatwg-encoding@3.1.1: Use @exodus/bytes instead for a more spec-conformant and faster implementation
npm warn deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead
npm warn deprecated @humanwhocodes/config-array@0.13.0: Use @eslint/config-array instead
npm warn deprecated eslint@8.57.1: This version is no longer supported. Please see [https://eslint.org/version-support](https://eslint.org/version-support) for other options.

added 481 packages, and audited 483 packages in 19s

205 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
npm notice
npm notice New minor version of npm available! 11.9.0 -> 11.11.0
npm notice Changelog: [https://github.com/npm/cli/releases/tag/v11.11.0](https://github.com/npm/cli/releases/tag/v11.11.0)
npm notice To update run: npm install -g npm@11.11.0
npm notice
/usr/bin/docker compose -f docker-compose.yml up --abort-on-container-exit
time="2026-02-26T10:13:39Z" level=warning msg="Found orphan containers ([source-app-run-9982c7c6e6b6]) for this project. If you removed or renamed this service in your compose file, you can run this command with the --remove-orphans flag to clean it up."
 Container source-app-1  Creating
 Container source-app-1  Created
Attaching to app-1
app-1  | DEBUG=axios,page-loader,hexlet-tests* npm test -s
app-1  | 
app-1  |  RUN  v3.2.4 /project
app-1  | 
app-1  |  ❯ __tests__/10-prepare.test.js (1 test | 1 failed) 27ms
app-1  |    × entry point 23ms
app-1  |      → Parse failure: Expression expected
app-1  | At file: /code/src/pageLoader.js:60:2
app-1  |  ↓ __tests__/30-cli.test.js (10 tests)
app-1  | 
app-1  | ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯
app-1  | 
app-1  |  FAIL  __tests__/20-index.test.js [ __tests__/20-index.test.js ]
app-1  | RollupError: Parse failure: Expression expected
app-1  | At file: /code/src/pageLoader.js:60:2
app-1  |   File: /code/src/pageLoader.js:60:2
app-1  |   58 |    if (fileName.endsWith(extension.replace('.', '-'))) {
app-1  |   59 |      fileName = fileName.slice(0, -extension.length),
app-1  |   60 |    }
app-1  |      |    ^
app-1  |   61 |  
app-1  |   62 |    return `${fileName}${extension}`
app-1  |  ❯ getRollupError node_modules/rollup/dist/es/shared/parseAst.js:402:41
app-1  | 
app-1  |  Test Files  2 failed | 1 skipped (3)
app-1  |       Tests  1 failed (11)
app-1  |    Start at  10:13:40
app-1  |  ❯ convertProgram node_modules/rollup/dist/es/shared/parseAst.js:1114:26
app-1  |  ❯ parseAstAsync node_modules/rollup/dist/es/shared/parseAst.js:2100:106
app-1  |  ❯ ssrTransformScript node_modules/vite/dist/node/chunks/config.js:15374:9
app-1  |  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22701:64
app-1  | 
app-1  | ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/2]⎯
app-1  | 
app-1  | 
app-1  | ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
app-1  | 
app-1  |  FAIL  __tests__/10-prepare.test.js > entry point
app-1  | RollupError: Parse failure: Expression expected
app-1  | At file: /code/src/pageLoader.js:60:2
app-1  |   File: /code/src/pageLoader.js:60:2
app-1  |   58 |    if (fileName.endsWith(extension.replace('.', '-'))) {
app-1  |   59 |      fileName = fileName.slice(0, -extension.length),
app-1  |   60 |    }
app-1  |      |    ^
app-1  |   61 |  
app-1  |   62 |    return `${fileName}${extension}`
app-1  |  ❯ getRollupError node_modules/rollup/dist/es/shared/parseAst.js:402:41
app-1  |  ❯ convertProgram node_modules/rollup/dist/es/shared/parseAst.js:1114:26
app-1  |  ❯ parseAstAsync node_modules/rollup/dist/es/shared/parseAst.js:2100:106
app-1  |  ❯ ssrTransformScript node_modules/vite/dist/node/chunks/config.js:15374:9
app-1  |  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22701:64
app-1  | 
app-1  | ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/2]⎯
app-1  | 
app-1  |    Duration  488ms (transform 72ms, setup 0ms, collect 289ms, tests 27ms, environment 1ms, prepare 314ms)
app-1  | 
app-1  | make: *** [Makefile:37: test] Error 1

app-1 exited with code 2
Aborting on container exit...
 Container source-app-1  Stopping
 Container source-app-1  Stopped

Error: The tests have failed. Examine what they have to say. Inhale deeply. Exhale. Fix the code.
Error: The process '/usr/bin/docker' failed with exit code 2
    at ExecState._setResult (file:///home/runner/work/_actions/hexlet/project-action/release/dist/run-tests/index.js:2:206396)
    at ExecState.CheckComplete (file:///home/runner/work/_actions/hexlet/project-action/release/dist/run-tests/index.js:2:205956)
    at ChildProcess.<anonymous> (file:///home/runner/work/_actions/hexlet/project-action/release/dist/run-tests/index.js:2:204797)
2s
0s
0s
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
    fileName = fileName.slice(0, -extension.length),
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
  { selector: 'script', attribute: 'src', type: 'script' }
]

const validateOutputDirectory = async (outputDir) => {
  try {
    await fs.access(outputDir, fs.constants.F_OK)
  }
  catch {
    throw new FileSystemError(
      `Output directory does not exist: ${outputDir}`,
      'ENOENT'
    )
  }

  try {
    await fs.access(outputDir, fs.constants.W_OK)
  }
  catch {
    throw new FileSystemError(
      `No write permission for output directory: ${outputDir}`,
      'EACCES'
    )
  }

  try {
    const stats = await fs.stat(outputDir)
    if (!stats.isDirectory()) {
      throw new FileSystemError(
        `Output path is not a directory: ${outputDir}`,
        'ENOTDIR'
      )
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw new FileSystemError(
        `Cannot access output directory: ${error.message}`,
        error.code,
      )
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
    maxRedirects: 5
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
          type
        })
      }
    })
  })

  if (resources.length === 0) {
    return $.html()
  }

  await fs.mkdir(outputDir, { recursive: true })

  const downloadPromises = resources.map(async (resource) => {
    try {
      const localFileName = await downloadResource(resource.url, baseUrl, outputDir)
      const localPath = path.join(resourcesDir, localFileName)
      $(resource.element).attr(resource.attribute, localPath)
      return { success: true, type: resource.type, url: resource.url }
    } catch (error) {
      logError(`Failed to download ${resource.type}: ${resource.url} - ${error.message}`)
      return { success: false, type: resource.type, url: resource.url }
    }
  })

  await Promise.all(downloadPromises)
  return $.html()
}

const pageLoader = async (url, outputDir = process.cwd()) => {
  log(`Starting page-loader for URL: ${url}`)

  try {
    new URL(url)
  } catch {
    throw new PageLoaderError(
      `Invalid URL: ${url}. Please provide a valid URL including protocol (e.g., https://example.com)`,
      'INVALID_URL'
    )
  }

  await validateOutputDirectory(outputDir)

  const response = await axios.get(url, {
    validateStatus: (status) => status >= 200 && status < 400,
    timeout: 30000,
    maxRedirects: 5,
    headers: {
      'User-Agent': 'Page-Loader/1.0.0'
    }
  }).catch((error) => {
    if (error.response) {
      throw new NetworkError(
        `Failed to load page: ${error.response.status} ${error.response.statusText}`,
        'HTTP_ERROR',
        error.response.status
      )
    }
    if (error.code === 'ENOTFOUND') {
      throw new NetworkError(
        `Failed to load page - host not found: ${new URL(url).host}`,
        'ENOTFOUND'
      )
    }
    if (error.code === 'ECONNREFUSED') {
      throw new NetworkError(
        `Failed to load page - connection refused: ${new URL(url).host}`,
        'ECONNREFUSED'
      )
    }
    if (error.code === 'ETIMEDOUT') {
      throw new NetworkError(
        `Failed to load page - timeout: ${url}`,
        'ETIMEDOUT'
      )
    }
    throw new NetworkError(
      `Failed to load page: ${error.message}`,
      'NETWORK_ERROR'
    )
  })

  const htmlFileName = generateHtmlFileName(url)
  const htmlFilePath = path.join(outputDir, htmlFileName)
  const filesDirName = generateFilesDirName(url)
  const filesDirPath = path.join(outputDir, filesDirName)

  const modifiedHtml = await processHtml(
    response.data,
    url,
    filesDirName,
    filesDirPath
  )

  await fs.writeFile(htmlFilePath, modifiedHtml)
  log(`✓ Page saved: ${htmlFilePath}`)

  return htmlFilePath
}

export default pageLoader
