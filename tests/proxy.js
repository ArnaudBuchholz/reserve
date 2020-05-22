'use strict'

const { createWriteStream, mkdir } = require('fs')
const { dirname, join } = require('path')
const { capture, log, serve } = require('..')

const mkdirAsync = require('util').promisify(mkdir)

const cacheBasePath = join(__dirname, 'cache')
mkdirAsync(cacheBasePath, { recursive: true }) // Should wait for completion

log(serve({
  port: 8080,
  mappings: [{
    match: /^\/http:\/\/([^/]*)\/(.*)/,
    file: './cache/$1/$2',
    'ignore-if-not-found': true
  }, {
    method: 'GET',
    match: /^http:\/\/([^/]*)\/(.*)/,
    custom: async (request, response, server, path) => {
      if (/\.(ico|js|css|svg|jpe?g)$/.exec(path)) {
        const cachePath = join(cacheBasePath, server, path)
        const cacheFolder = dirname(cachePath)
        await mkdirAsync(cacheFolder, { recursive: true })
        const file = createWriteStream(cachePath) // auto closed
        capture(response, file)
          .catch(reason => {
            console.error(`Unable to cache ${cachePath}`, reason)
          })
      }
    }
  }, {
    match: /^(.*)/,
    url: '$1'
  }]
}), process.argv.includes('--verbose'))
