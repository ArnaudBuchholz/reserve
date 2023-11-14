'use strict'

const { createWriteStream, mkdir } = require('fs')
const { dirname, join } = require('path')
const { capture, log, serve } = require('..')

const mkdirAsync = require('util').promisify(mkdir)

const cacheBasePath = join(__dirname, 'cache')
mkdirAsync(cacheBasePath, { recursive: true }) // Should wait for completion

log(serve({
  port: 8005,
  mappings: [{
    match: /^\/(.*)/,
    file: './cache/$1',
    'ignore-if-not-found': true
  }, {
    method: 'GET',
    custom: async (request, response) => {
      if (/\.(ico|js|css|svg|jpe?g)$/.exec(request.url)) {
        const cachePath = join(cacheBasePath, '.' + request.url)
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
    match: /^\/(.*)/,
    url: 'http://facetheforce.today/$1'
  }]
}), process.argv.includes('--verbose'))
