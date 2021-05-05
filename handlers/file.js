'use strict'

const fs = require('fs')
const { promisify } = require('util')
const mime = require('../detect/mime')
const path = require('path')
const { format: formatLastModified } = require('../lastModified')

const defaultMimeType = mime('bin')

const cfs = 'custom-file-system'
const matchcase = 'case-sensitive'
const i404 = 'ignore-if-not-found'
const cache = 'caching-strategy'

const nodeFs = {
  stat: promisify(fs.stat),
  readdir: promisify(fs.readdir),
  createReadStream: (path, options) => Promise.resolve(fs.createReadStream(path, options))
}

function processCache (request, cachingStrategy, { mtime }) {
  if (cachingStrategy === 'modified') {
    const lastModified = formatLastModified(mtime)
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
  if ((!ifRange || ifRange === formatLastModified(mtime)) && bytesRange && !bytesRange[3] /* Multipart not supported */) {
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

function sendFile ({ cachingStrategy, request, response, fs, filePath }, fileStat) {
  return new Promise((resolve, reject) => {
    const { header: cacheHeader, status: cacheStatus } = processCache(request, cachingStrategy, fileStat)
    const { start, end, header: rangeHeader, status: rangeStatus, contentLength } = processBytesRange(request, fileStat)
    const status = cacheStatus || rangeStatus
    response.writeHead(status, {
      'content-type': mime(path.extname(filePath)),
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
  const filePath = path.join(context.filePath, 'index.html')
  await context.checkPath(filePath)
  const stat = await context.fs.stat(filePath)
  if (stat.isDirectory()) {
    throw new Error('index.html not a file')
  }
  return sendFile({ ...context, filePath }, stat)
}

async function checkCaseSensitivePath (filePath) {
  const folderPath = path.dirname(filePath)
  if (folderPath && folderPath !== filePath) {
    const name = path.basename(filePath)
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
  schema: {
    [matchcase]: {
      type: 'boolean',
      defaultValue: false
    },
    [cfs]: {
      types: ['string', 'object'],
      defaultValue: nodeFs
    },
    [i404]: {
      type: 'boolean',
      defaultValue: false
    },
    [cache]: {
      types: ['string', 'number'],
      defaultValue: 0
    },
    strict: {
      type: 'boolean',
      defaultValue: false
    }
  },
  method: 'GET,HEAD',
  validate: async mapping => {
    if (typeof mapping[cfs] === 'string') {
      mapping[cfs] = require(mapping[cfs])
    }
    const apis = ['stat', 'createReadStream']
    if (mapping[matchcase]) {
      apis.push('readdir')
    }
    const invalids = apis.filter(name => typeof mapping[cfs][name] !== 'function')
    if (invalids.length) {
      throw new Error(`Invalid custom-file-system specification (${invalids.join(', ')})`)
    }
    const cachingStrategy = mapping[cache]
    if (typeof cachingStrategy === 'string' && cachingStrategy !== 'modified') {
      throw new Error('Invalid caching-strategy name')
    }
  },
  redirect: ({ request, mapping, redirect, response }) => {
    let filePath = /([^?#]+)/.exec(unescape(redirect))[1] // filter URL parameters & hash
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(mapping.cwd, filePath)
    }
    const directoryAccess = !!filePath.match(/(\\|\/)$/) // Test known path separators
    if (directoryAccess) {
      filePath = filePath.substring(0, filePath.length - 1)
    }
    const context = {
      request,
      response,
      cachingStrategy: mapping[cache],
      fs: mapping[cfs],
      filePath
    }
    if (mapping.strict) {
      context.checkPath = checkStrictPath
    } else if (mapping[matchcase]) {
      context.checkPath = checkCaseSensitivePath
    } else {
      context.checkPath = async () => {}
    }
    return context.fs.stat(filePath)
      .then(async stat => {
        await context.checkPath(filePath, mapping.strict)
        const isDirectory = stat.isDirectory()
        if (isDirectory ^ directoryAccess) {
          return 404 // Can't ignore if not found
        }
        if (isDirectory) {
          return sendIndex(context)
        }
        return sendFile(context, stat)
      })
      .catch(() => {
        if (!mapping[i404]) {
          return 404
        }
      })
  }
}
