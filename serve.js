'use strict'

const { check } = require('./configuration')
const dispatcher = require('./dispatcher')
const EventEmitter = require('events')
const http = require('http')
const https = require('https')

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
    .then(configuration => createServerAsync(configuration, dispatcher.bind(eventEmitter, configuration))
      .then(() => {
        eventEmitter.emit('ready', {
          url: `${configuration.protocol}://${configuration.hostname}:${configuration.port}/`
        })
      })
    )
    .catch(reason => eventEmitter.emit('error', { reason }))
  return eventEmitter
}
