'use strict'

const fs = require('fs')
const { promisify } = require('util')
const mime = require('../detect/mime')
const path = require('path')

const defaultMimeType = mime.getType('bin')

const cfs = 'custom-file-system'
const matchcase = 'case-sensitive'
const i404 = 'ignore-if-not-found'

const nodeFs = {
  stat: promisify(fs.stat),
  readdir: promisify(fs.readdir),
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

async function sendIndex (context) {
  const filePath = path.join(context.filePath, 'index.html')
  await context.checkCaseSensitivePath(filePath)
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
    if (mapping[matchcase]) {
      context.checkCaseSensitivePath = checkCaseSensitivePath
    } else {
      context.checkCaseSensitivePath = async () => {}
    }
    return context.fs.stat(filePath)
      .then(async stat => {
        await context.checkCaseSensitivePath(filePath)
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
