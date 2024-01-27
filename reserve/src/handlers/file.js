'use strict'

const { basename, createReadStream, dirname, join, readdir, stat } = require('../node-api')
const { $handlerPrefix, $fileCache } = require('../symbols')
const send = require('../send')
const mimeTypes = require('../mime')
const smartImport = require('../smartImport')
const cacheFactory = require('punycache')

const $customFileSystem = 'custom-file-system'
const $cachingStrategy = 'caching-strategy'
const $mimeTypes = 'mime-types'
const $static = 'static'

const defaultStatic = {}

const nodeFs = {
  stat,
  readdir,
  createReadStream
}

const buildStaticNodeFs = mapping => {
  const cache = cacheFactory(mapping[$static])
  const { stat, readdir, createReadStream } = mapping[$customFileSystem]
  mapping[$fileCache] = cache

  const wrap = (prefix, api) => {
    return async path => {
      const key = `${prefix}:${path}`
      const existing = cache.get(key)
      if (existing) {
        return existing
      }
      const query = api(path)
      cache.set(key, query)
      return query
    }
  }

  mapping[$customFileSystem] = {
    stat: wrap('stat', stat),
    readdir: wrap('dir', readdir),
    createReadStream
  }
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

async function sendFile ({ cachingStrategy, mapping, request, response, fs, filePath }, fileStat) {
  const { header: cacheHeader, status: cacheStatus } = processCache(request, cachingStrategy, fileStat)
  const { start, end, header: rangeHeader, status: rangeStatus, contentLength } = processBytesRange(request, fileStat)
  let { statusCode } = response
  if (statusCode === 200) {
    statusCode = cacheStatus || rangeStatus
  }
  const fileExtension = (/\.([^.]*)$/.exec(filePath) || [])[1]
  const mimeType = mapping[$mimeTypes][fileExtension] || mimeTypes[fileExtension] || mimeTypes.bin
  const noBody = request.method === 'HEAD' || contentLength === 0 || request.aborted || statusCode === 304
  let stream
  if (!noBody) {
    stream = await fs.createReadStream(filePath, { start, end })
    if (request.aborted) {
      response.end()
      return
    }
  }
  return send(response, stream, {
    statusCode,
    headers: {
      'content-type': mimeType,
      'content-length': contentLength,
      'accept-ranges': 'bytes',
      ...rangeHeader,
      ...cacheHeader
    },
    noBody
  })
}

async function sendIndex (context) {
  const filePath = join(context.filePath, 'index.html')
  const stat = await context.fs.stat(filePath)
  if (stat.isDirectory()) {
    throw new Error('index.html not a file')
  }
  return sendFile({ ...context, filePath }, stat)
}

async function checkStrictPath (fs, cwd, filePath) {
  let path = filePath
  while (path !== cwd) {
    const folderPath = dirname(path)
    const name = basename(path)
    const names = await fs.readdir(folderPath)
    if (!names.includes(name)) {
      throw new Error('Not found')
    }
    path = folderPath
  }
}

module.exports = {
  [$handlerPrefix]: 'file',
  schema: {
    [$customFileSystem]: {
      types: ['string', 'object'],
      defaultValue: nodeFs
    },
    [$cachingStrategy]: {
      types: ['string', 'number'],
      defaultValue: 0
    },
    [$mimeTypes]: {
      type: 'object',
      defaultValue: {}
    },
    [$static]: {
      types: ['boolean', 'object'],
      defaultValue: defaultStatic
    }
  },
  method: 'GET,HEAD',
  validate: async mapping => {
    if (typeof mapping[$customFileSystem] === 'string') {
      mapping[$customFileSystem] = await smartImport(join(mapping.cwd, mapping[$customFileSystem]))
    }
    const apis = ['stat', 'createReadStream', 'readdir']
    const invalids = apis.filter(name => typeof mapping[$customFileSystem][name] !== 'function')
    if (invalids.length) {
      throw new Error(`Invalid ${$customFileSystem} specification (${invalids.join(', ')})`)
    }
    const cachingStrategy = mapping[$cachingStrategy]
    if (typeof cachingStrategy === 'string' && cachingStrategy !== 'modified') {
      throw new Error(`Invalid ${$cachingStrategy} name`)
    }
    if (mapping[$static] === defaultStatic) {
      mapping[$static] = mapping[$customFileSystem] === nodeFs
    }
    if (mapping[$static] === true) {
      mapping[$static] = {}
    }
    if (mapping[$static]) {
      buildStaticNodeFs(mapping)
    }
  },
  redirect: ({ request, mapping, redirect, response }) => {
    let filePath = /([^?#]+)/.exec(unescape(redirect))[1] // filter URL parameters & hash
    filePath = join(mapping.cwd, filePath)
    if (!filePath.startsWith(mapping.cwd)) {
      return Promise.resolve()
    }
    const directoryAccess = !!filePath.match(/(\\|\/)$/) // Test known path separators
    if (directoryAccess) {
      filePath = filePath.substring(0, filePath.length - 1)
    }
    const context = {
      cachingStrategy: mapping[$cachingStrategy],
      fs: mapping[$customFileSystem],
      filePath,
      mapping,
      request,
      response
    }
    return context.fs.stat(filePath)
      .then(async stat => {
        await checkStrictPath(context.fs, mapping.cwd, filePath)
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
