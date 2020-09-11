'use strict'

const fs = require('fs')
const util = require('util')
const mime = require('../detect/mime')
const path = require('path')

const defaultMimeType = mime.getType('bin')

const nodeFs = {
  stat: util.promisify(fs.stat),
  readdir: util.promisify(fs.readdir),
  createReadStream: (path, options) => Promise.resolve(fs.createReadStream(path, options))
}

function sendFile ({ request, response, fs, filePath }, stat) {
  return new Promise((resolve, reject) => {
    response.writeHead(200, {
      'Content-Type': mime.getType(path.extname(filePath)) || defaultMimeType,
      'Content-Length': stat.size
    })
    if (request.method === 'HEAD') {
      response.end()
      resolve()
    } else {
      response.on('finish', resolve)
      fs.createReadStream(filePath)
        .then(stream => {
          stream
            .on('error', reject)
            .pipe(response)
        })
    }
  })
}

function sendIndex (context) {
  const filePath = path.join(context.filePath, 'index.html')
  return context.fs.stat(filePath)
    .then(stat => {
      if (stat.isDirectory()) {
        throw new Error('index.html not a file')
      }
      return sendFile({ ...context, filePath }, stat)
    })
}

async function checkCaseSensitivePath (fs, filePath) {
  const folderPath = path.dirname(filePath)
  if (folderPath && folderPath !== filePath) {
    const name = path.basename(filePath)
    const names = await fs.readdir(folderPath)
    if (!names.includes(name)) {
      throw new Error('Not found')
    }
    return checkCaseSensitivePath(fs, folderPath)
  }
}

const cfs = 'custom-file-system'

module.exports = {
  schema: {
    'case-sensitive': {
      type: 'boolean',
      defaultValue: false
    },
    [cfs]: {
      type: 'object',
      defaultValue: nodeFs
    },
    'ignore-if-not-found': {
      type: 'boolean',
      defaultValue: false
    }
  },
  method: 'GET,HEAD',
  validate: async mapping => {
    if (typeof mapping[cfs] === 'string') {
      mapping[cfs] = require(mapping[cfs])
    }
    const types = [typeof mapping[cfs].stat, typeof mapping[cfs].readdir, typeof mapping[cfs].createReadStream]
    if (types.some(type => type !== 'function')) {
      throw new Error('Invalid custom-file-system specification')
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
      fs: mapping[cfs],
      filePath
    }
    return context.fs.stat(filePath)
      .then(async stat => {
        if (mapping['case-sensitive']) {
          await checkCaseSensitivePath(context.fs, filePath)
        }
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
        if (!mapping['ignore-if-not-found']) {
          return 404
        }
      })
  }
}
