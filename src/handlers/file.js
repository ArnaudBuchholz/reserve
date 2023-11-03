'use strict'

const { basename, createReadStream, dirname, isAbsolute, join, readdir, stat } = require('../node-api')
const { $handlerPrefix } = require('../symbols')

const app = 'application'
const img = 'image'
const txt = 'text'
const html = `${txt}/html`
const jpeg = `${img}/jpeg`
const text = `${txt}/plain`

const mimeTypes = {
  bin: `${app}/octet-stream`,
  css: `${txt}/css`,
  gif: `${img}/gif`,
  html,
  htm: html,
  jpeg,
  jpg: jpeg,
  js: `${app}/javascript`,
  json: `${app}/json`,
  mp4: 'video/mp4',
  pdf: `${app}/pdf`,
  png: `${img}/png`,
  svg: `${img}/svg+xml`,
  text,
  txt: text,
  xml: `${app}/xml`
}

const cfs = 'custom-file-system'
const cache = 'caching-strategy'
const mt = 'mime-types'

const nodeFs = {
  stat,
  readdir,
  createReadStream: (path, options) => Promise.resolve(createReadStream(path, options))
}

function processCache (request, cachingStrategy, { mtime }) {
  if (cachingStrategy === 'modified') {
    const lastModified = mtime.toUTCString()
    const modifiedSince = request.headers['if-modified-since']
    let status
    if (modifiedSince && lastModified === modifiedSince) {
      status = 304
    }
    return { header: { 'cache-control': 'no-cache', 'last-modified': lastModified }, status }
  }
  if (cachingStrategy > 0) {
    return { header: { 'cache-control': `public, max-age=${cachingStrategy}, immutable` } }
  }
  return { header: { 'cache-control': 'no-store' } }
}

function processBytesRange (request, { mtime, size }) {
  const bytesRange = /bytes=(\d+)-(\d+)?(,)?/.exec(request.headers.range)
  const ifRange = request.headers['if-range']
  if ((!ifRange || ifRange === mtime.toUTCString()) && bytesRange && !bytesRange[3] /* Multipart not supported */) {
    const start = parseInt(bytesRange[1], 10)
    let end
    if (bytesRange[2]) {
      end = parseInt(bytesRange[2], 10)
    } else {
      end = size - 1
    }
    if (start > end || start >= size) {
      return { status: 416, contentLength: 0 }
    }
    return { start, end, header: { 'content-range': `bytes ${start}-${end}/${size}` }, status: 206, contentLength: end - start + 1 }
  }
  return { status: 200, contentLength: size }
}

function sendFile ({ cachingStrategy, mapping, request, response, fs, filePath }, fileStat) {
  return new Promise((resolve, reject) => {
    const { header: cacheHeader, status: cacheStatus } = processCache(request, cachingStrategy, fileStat)
    const { start, end, header: rangeHeader, status: rangeStatus, contentLength } = processBytesRange(request, fileStat)
    const status = cacheStatus || rangeStatus
    const fileExtension = (/\.([^.]*)$/.exec(filePath) || [])[1]
    const mimeType = mapping[mt][fileExtension] || mimeTypes[fileExtension] || mimeTypes.bin
    response.writeHead(status, {
      'content-type': mimeType,
      'content-length': contentLength,
      'accept-ranges': 'bytes',
      ...rangeHeader,
      ...cacheHeader
    })
    if (request.method === 'HEAD' || contentLength === 0 || request.aborted || status === 304) {
      response.end()
      resolve()
      return
    }
    response.on('finish', resolve)
    fs.createReadStream(filePath, { start, end })
      .then(stream => {
        if (request.aborted) {
          stream.destroy()
          response.end()
          resolve()
        } else {
          stream.on('error', reject).pipe(response)
        }
      })
  })
}

async function sendIndex (context) {
  const filePath = join(context.filePath, 'index.html')
  await context.checkPath(filePath)
  const stat = await context.fs.stat(filePath)
  if (stat.isDirectory()) {
    throw new Error('index.html not a file')
  }
  return sendFile({ ...context, filePath }, stat)
}

async function checkCaseSensitivePath (filePath) {
  const folderPath = dirname(filePath)
  if (folderPath && folderPath !== filePath) {
    const name = basename(filePath)
    const names = await this.fs.readdir(folderPath)
    if (!names.includes(name)) {
      throw new Error('Not found')
    }
    return checkCaseSensitivePath.call(this, folderPath)
  }
}

async function checkStrictPath (filePath) {
  if (filePath.includes('//')) {
    throw new Error('Empty folder')
  }
  return checkCaseSensitivePath.call(this, filePath)
}

module.exports = {
  [$handlerPrefix]: 'file',
  schema: {
    [cfs]: {
      types: ['string', 'object'],
      defaultValue: nodeFs
    },
    [cache]: {
      types: ['string', 'number'],
      defaultValue: 0
    },
    [mt]: {
      type: 'object',
      defaultValue: {}
    }
  },
  method: 'GET,HEAD',
  validate: async mapping => {
    if (typeof mapping[cfs] === 'string') {
      mapping[cfs] = require(join(mapping.cwd, mapping[cfs]))
    }
    const apis = ['stat', 'createReadStream', 'readdir']
    const invalids = apis.filter(name => typeof mapping[cfs][name] !== 'function')
    if (invalids.length) {
      throw new Error(`Invalid ${cfs} specification (${invalids.join(', ')})`)
    }
    const cachingStrategy = mapping[cache]
    if (typeof cachingStrategy === 'string' && cachingStrategy !== 'modified') {
      throw new Error(`Invalid ${cache} name`)
    }
  },
  redirect: ({ request, mapping, redirect, response }) => {
    let filePath = /([^?#]+)/.exec(unescape(redirect))[1] // filter URL parameters & hash
    if (!isAbsolute(filePath)) {
      filePath = join(mapping.cwd, filePath)
    }
    const directoryAccess = !!filePath.match(/(\\|\/)$/) // Test known path separators
    if (directoryAccess) {
      filePath = filePath.substring(0, filePath.length - 1)
    }
    const context = {
      cachingStrategy: mapping[cache],
      fs: mapping[cfs],
      filePath,
      mapping,
      request,
      response,
      checkPath: checkStrictPath
    }
    return context.fs.stat(filePath)
      .then(async stat => {
        await context.checkPath(filePath)
        const isDirectory = stat.isDirectory()
        if (isDirectory ^ directoryAccess) {
          return
        }
        if (isDirectory) {
          return sendIndex(context)
        }
        return sendFile(context, stat)
      })
      .catch(() => {})
  }
}
