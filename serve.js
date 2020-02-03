'use strict'

const { check } = require('./configuration')
const dispatcher = require('./dispatcher')
const EventEmitter = require('events')
const http = require('http')
const https = require('https')
const IConfiguration = require('./iconfiguration')

function createServer (configuration, requestHandler) {
  if (configuration.ssl) {
    return https.createServer({
      key: configuration.ssl.key,
      cert: configuration.ssl.cert
    }, requestHandler)
  }
  return http.createServer(requestHandler)
}

function createServerAsync (configuration, requestHandler) {
  return new Promise((resolve, reject) => {
    createServer(configuration, requestHandler)
      .listen(configuration.port, configuration.hostname, err => err ? reject(err) : resolve())
  })
}

module.exports = jsonConfiguration => {
  const eventEmitter = new EventEmitter()
  check(jsonConfiguration)
    .then(configuration => {
      configuration.interface = new IConfiguration(configuration)
      return createServerAsync(configuration, dispatcher.bind(eventEmitter, configuration))
        .then(() => {
          eventEmitter.emit('ready', {
            url: `${configuration.protocol}://${configuration.hostname || '0.0.0.0'}:${configuration.port}/`
          })
        })
    })
    .catch(reason => eventEmitter.emit('error', { reason }))
  return eventEmitter
}
