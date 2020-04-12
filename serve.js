'use strict'

const { check } = require('./configuration')
const dispatcher = require('./dispatcher')
const EventEmitter = require('events')
const http = require('http')
const https = require('https')
const { $configurationInterface } = require('./symbols')

function createServer (configuration, requestHandler) {
  if (configuration.ssl) {
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
    server.listen(configuration.port, configuration.hostname, err => err ? reject(err) : resolve())
  })
}

module.exports = jsonConfiguration => {
  const eventEmitter = new EventEmitter()
  check(jsonConfiguration)
    .then(configuration => {
      configuration.listeners.forEach(register => register(eventEmitter))
      return createServerAsync(eventEmitter, configuration, dispatcher)
        .then(() => {
          eventEmitter.emit('ready', {
            url: `${configuration.protocol}://${configuration.hostname || '0.0.0.0'}:${configuration.port}/`
          })
        })
    })
    .catch(reason => eventEmitter.emit('error', { reason }))
  return eventEmitter
}
