'use strict'

const fs = require('fs')
const mime = require('mime')
const path = require('path')
const util = require('util')

const defaultMimeType = mime.getType('bin')
const statAsync = util.promisify(fs.stat)

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
    .then(stat => sendFile(response, indexPath, stat), () => 404)
}

module.exports = {
  schema: {},
  redirect: async ({ request, mapping, redirect, response }) => {
    if (request.method !== 'GET') {
      return 405
    }
    let filePath = /([^?#]+)/.exec(unescape(redirect))[1] // filter URL parameters & hash
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(mapping.cwd, filePath)
    }
    const directoryAccess = filePath.endsWith('/')
    if (directoryAccess) {
      filePath = filePath.substring(0, filePath.length - 1)
    }
    let stat
    try {
      stat = await statAsync(filePath)
    } catch (e) {
      return 404
    }
    const isDirectory = stat.isDirectory()
    if (isDirectory ^ directoryAccess) {
      return 404
    }
    if (isDirectory) {
      return sendIndex(response, filePath)
    }
    return sendFile(response, filePath, stat)
  }
}
