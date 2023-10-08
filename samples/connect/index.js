'use strict'

const { log, serve } = require('../..') // use require('reserve')
const { createReadStream, readdir, readFile, stat } = require('fs')
const { promisify } = require('util')
const readFileAsync = promisify(readFile)
const statAsync = promisify(stat)
const { Readable } = require('stream')
const EventEmitter = require('events')
const defer = require('../../defer')

const isHtml = path => !!path.match(/\.html?$/)
const htmlInject = '<script src="/api/connect.js"></script>'

const customFileSystem = {
  stat: path => statAsync(path)
    .then(stats => {
      if (isHtml(path)) {
        stats.size += htmlInject.length
      }
      return stats
    }),
  readdir: promisify(readdir),
  createReadStream: async (path, options) => {
    if (isHtml(path)) {
      const buffer = (await readFileAsync(path))
        .toString()
        .replace('</html>', htmlInject + '</html>')
      return Readable.from(buffer)
    }
    return createReadStream(path, options)
  }
}

const events = new EventEmitter()
const connected = false
let waitForConnection

log(serve({
  port: 8080,
  mappings: [{
    match: /^\/api\/events/,
    custom: (request, response) => {
      response.writeHead(200, {
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache'
      })
      const write = () => response.write(`event: connect\nid: ${Date.now()}\ndata: \n\n`)
      events.on('connect', write)
      let resolver
      const promise = new Promise(resolve => {
        resolver = resolve
      })
      const close = () => {
        events.off('connect', write)
        try {
          response.end()
        } finally {
          resolver()
        }
      }
      request.on('close', close)
      request.on('abort', close)
      return promise
    }
  }, {
    match: /^\/api\/test/,
    custom: async (request, response) => {
      if (!connected) {
        const [promise, done, fail] = defer()
        waitForConnection = promise
        waitForConnection.done = done
        waitForConnection.fail = fail
        events.emit('connect')
        await waitForConnection
      }
      response.writeHead(200, {
        'content-type': 'text/plain'
      })
      response.end('Welcome !')
    }
  }, {
    match: /^\/$/,
    custom: () => '/index.html'
  }, {
    match: /^\/(.*)/,
    file: './www/$1',
    'custom-file-system': customFileSystem
  }]
}))
