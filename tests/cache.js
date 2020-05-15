'use strict'

const { createWriteStream, mkdir, readdir } = require('fs')
const { dirname, join } = require('path')
const capture = require('../capture')

const mkdirAsync = require('util').promisify(mkdir)

const cacheBasePath = join(__dirname, 'cache')
mkdirAsync(cacheBasePath, { recursive: true }) // Should wait for completion

module.exports = async (request, response) => {
  if (/\.(js|css|svg|jpg)$/.exec(request.url)) {
    const cachePath = join(cacheBasePath, '.' + request.url)
    const cacheFolder = dirname(cachePath)
    await mkdirAsync(cacheFolder, { recursive: true })
    const file = createWriteStream(cachePath)
    capture(response, file)
      .catch(reason => {
        console.error(`Unable to cache ${cachePath}`, reason)
      })
  }
}
