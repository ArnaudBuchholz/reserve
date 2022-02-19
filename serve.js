'use strict'

const { check } = require('./configuration')
const dispatcher = require('./dispatcher')
const EventEmitter = require('events')
const http = require('http')
const https = require('https')
const http2 = require('http2')
const {
  $configurationEventEmitter,
  $configurationInterface
} = require('./symbols')
const defer = require('./defer')

function createServer (configuration, requestHandler) {
  const { httpOptions } = configuration
  if (configuration.ssl) {
    if (configuration.http2) {
      return http2.createSecureServer({
        key: configuration.ssl.key,
        cert: configuration.ssl.cert,
        ...httpOptions
      }, requestHandler)
    }
    return https.createServer({
      key: configuration.ssl.key,
      cert: configuration.ssl.cert,
      ...httpOptions
    }, requestHandler)
  }
  if (configuration.http2) {
    return http2.createServer(httpOptions, requestHandler)
  }
  return http.createServer(httpOptions, requestHandler)
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
  const [serverAvailable, ready, failed] = defer()
  check(jsonConfiguration)
    .then(configuration => {
      configuration[$configurationEventEmitter] = eventEmitter
      configuration.listeners.forEach(register => register(eventEmitter))
      return createServerAsync(eventEmitter, configuration, dispatcher)
        .then(server => {
          ready(server)
          const { port } = server.address()
          const { http2 } = configuration
          eventEmitter.emit('ready', {
            url: `${configuration.protocol}://${configuration.hostname || '0.0.0.0'}:${port}/`,
            port,
            http2
          })
        })
    })
    .catch(reason => {
      failed(reason)
      eventEmitter.emit('error', { reason })
    })
  eventEmitter.close = function () {
    return serverAvailable
      .then(server => {
        return new Promise(resolve => server.close(() => resolve()))
      })
  }
  return eventEmitter
}
