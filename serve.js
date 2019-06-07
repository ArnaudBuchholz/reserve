'use strict'

const EventEmitter = require('events')
const fs = require('fs')
const path = require('path')
const util = require('util')

const readdir = util.promisify(fs.readdir)

const handlers = {}

function buildServer (configuration, requestHandler) {
  let protocol
  let server
  if (configuration.ssl) {
    protocol = 'https'
    server = https.createServer({
      key: fs.readFileSync(configuration.ssl.key),
      cert: fs.readFileSync(configuration.ssl.cert)
    }, requestHandler)
  } else {
    protocol = 'http'
    server = http.createServer(requestHandler)
  }
  return server
}

const handlersReady = readdir(path.join(__dirname, 'handlers'))
  .then(names => names
    .filter(name => name.endsWith('.js'))
    .map(name => path.basename(name, '.js'))
    .forEach(name => {
      handlers[name] = require(path.join(__dirname, 'handlers', name + '.js'))
    })
  )

module.exports = configuration => {
  const eventEmitter = new EventEmitter
  handlersReady
    .then
  return eventEmitter
}
