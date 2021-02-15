'use strict'

const { check } = require('./configuration')
const dispatcher = require('./dispatcher')
const EventEmitter = require('events')
const http = require('http')
const https = require('https')
const http2 = require('http2')
const { $configurationInterface } = require('./symbols')

function createServer (configuration, requestHandler) {
  if (configuration.ssl) {
    if (configuration.http2) {
      return http2.createSecureServer({
        key: configuration.ssl.key,
        cert: configuration.ssl.cert
      }, requestHandler)
    }
    return https.createServer({
      key: configuration.ssl.key,
      cert: configuration.ssl.cert
    }, requestHandler)
  }
  return http.createServer(requestHandler)
}

function createServerAsync (eventEmitter, configuration, dispatcher) {
  return new Promise((resolve, reject) => {
    const server = createServer(configuration, dispatcher.bind(eventEmitter, configuration))
    eventEmitter.emit('server-created', { configuration: configuration[$configurationInterface], server })
    let { port } = configuration
    if (port === 'auto') {
      port = 0
    }
    server.listen(port, configuration.hostname, err => err ? reject(err) : resolve(server))
  })
}

module.exports = jsonConfiguration => {
  const eventEmitter = new EventEmitter()
  check(jsonConfiguration)
    .then(configuration => {
      configuration.listeners.forEach(register => register(eventEmitter))
      return createServerAsync(eventEmitter, configuration, dispatcher)
        .then(server => {
          const port = server.address().port
          eventEmitter.emit('ready', {
            url: `${configuration.protocol}://${configuration.hostname || '0.0.0.0'}:${port}/`,
            port
          })
        })
    })
    .catch(reason => eventEmitter.emit('error', { reason }))
  return eventEmitter
}
