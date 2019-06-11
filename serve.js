'use strict'

const dispatcher = require('./dispatcher')
const checkConfiguration = require('./configuration')
const EventEmitter = require('events')
const fs = require('fs')
const http = require('http')
const https = require('https')
const path = require('path')
const util = require('util')

const readdirAsync = util.promisify(fs.readdir)

const handlers = {}

const handlersReady = readdirAsync(path.join(__dirname, 'handlers'))
  .then(names => names
    .filter(name => name.endsWith('.js'))
    .map(name => path.basename(name, '.js'))
    .forEach(name => {
      handlers[name] = require(path.join(__dirname, 'handlers', name + '.js'))
    })
  )

function createServer (configuration, requestHandler) {
  if (configuration.ssl) {
    return https.createServer({
      key: configuration.ssl.key,
      cert: configuration.ssl.cert
    }, requestHandler)
  }
  return http.createServer(requestHandler)
}

module.exports = configuration => {
  const eventEmitter = new EventEmitter()
  handlersReady
    .then(() => checkConfiguration(configuration, handlers))
    .then(() => new Promise((resolve, reject) => {
      createServer(configuration, dispatcher.bind(eventEmitter, configuration))
        .listen(configuration.port, configuration.hostname, err => err ? reject(err) : resolve())
    }))
    .then(() => {
      console.log(`Server running at ${configuration.protocol}://${configuration.hostname}:${configuration.port}/`.yellow)
      eventEmitter.emit('ready')
    })
    .catch(reason => eventEmitter.emit('error', reason))
  return eventEmitter
}
