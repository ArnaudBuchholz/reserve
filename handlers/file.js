'use strict'

const fs = require('fs')
const mime = require('../detect/mime')
const path = require('path')
const util = require('util')

const defaultMimeType = mime.getType('bin')
const statAsync = util.promisify(fs.stat)
const readdirAsync = util.promisify(fs.readdir)

function sendFile (response, filePath, stat) {
  return new Promise((resolve, reject) => {
    response.writeHead(200, {
      'Content-Type': mime.getType(path.extname(filePath)) || defaultMimeType,
      'Content-Length': stat.size
    })
    fs.createReadStream(filePath)
      .on('error', reject)
      .on('end', resolve)
      .pipe(response)
  })
}

function sendIndex (response, folderPath) {
  const indexPath = path.join(folderPath, 'index.html')
  return statAsync(indexPath)
    .then(stat => sendFile(response, indexPath, stat))
}

async function checkCaseSensitivePath (filePath) {
  const folderPath = path.dirname(filePath)
  if (folderPath && folderPath !== filePath) {
    const name = path.basename(filePath)
    const names = await readdirAsync(folderPath)
    if (!names.includes(name)) {
      throw new Error('Not found')
    }
    return checkCaseSensitivePath(folderPath)
  }
}

module.exports = {
  redirect: ({ request, mapping, redirect, response }) => {
    if (request.method !== 'GET') {
      return Promise.resolve(405)
    }
    let filePath = /([^?#]+)/.exec(unescape(redirect))[1] // filter URL parameters & hash
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(mapping.cwd, filePath)
    }
    const directoryAccess = !!filePath.match(/(\\|\/)$/) // Test known path separators
    if (directoryAccess) {
      filePath = filePath.substring(0, filePath.length - 1)
    }
    return statAsync(filePath)
      .then(async stat => {
        if (mapping['case-sensitive']) {
          await checkCaseSensitivePath(filePath)
        }
        const isDirectory = stat.isDirectory()
        if (isDirectory ^ directoryAccess) {
          return 404
        }
        if (isDirectory) {
          return sendIndex(response, filePath)
        }
        return sendFile(response, filePath, stat)
      })
      .catch(() => 404)
  }
}
