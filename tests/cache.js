'use strict'

const { mkdir, writeFile } = require('fs')
const { join } = require('path')
const { log, serve } = require('..')
const { promisify } = require('util')

const mkdirAsync = promisify(mkdir)
const writeFileAsync = promisify(writeFile)

const cacheBasePath = join(__dirname, 'cache')
const cacheFilePath = join(cacheBasePath, 'cache.txt')

async function main () {
  await mkdirAsync(cacheBasePath, { recursive: true })
  await writeFileAsync(cacheFilePath, `${new Date().toISOString()}
Hello World !`)

  log(serve({
    port: 8006,
    mappings: [{
      match: /^\//,
      file: cacheFilePath,
      'caching-strategy': 'modified'
    }]
  }), process.argv.includes('--verbose'))
}

main()
