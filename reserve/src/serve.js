'use strict'

const { http, http2, https } = require('./node-api')
const { newEventEmitter, EVENT_CREATED, EVENT_READY, EVENT_ERROR } = require('./event')
const { check } = require('./configuration')
const dispatcher = require('./dispatcher')
const {
  $configurationEventEmitter,
  $configurationInterface
} = require('./symbols')
const defer = require('./defer')
const getHostName = require('./hostname')

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

function createServerAsync (emit, configuration, dispatcher) {
  return new Promise((resolve, reject) => {
    const server = createServer(configuration, dispatcher.bind(null, configuration))
    emit(EVENT_CREATED, { configuration: configuration[$configurationInterface], server })
    let { port } = configuration
    if (port === 'auto') {
      port = 0
    }
    server.listen(port, configuration.hostname, err => err ? reject(err) : resolve(server))
  })
}

module.exports = jsonConfiguration => {
  const { on, emit } = newEventEmitter()
  const instance = { on }
  const [serverAvailable, ready, failed] = defer()
  check(jsonConfiguration)
    .then(configuration => {
      configuration[$configurationEventEmitter] = emit
      configuration.listeners.forEach(listen => listen(instance))
      const hostname = configuration.hostname || getHostName()
      return createServerAsync(emit, configuration, dispatcher)
        .then(server => {
          ready(server)
          const { port } = server.address()
          const { http2 } = configuration
          emit(EVENT_READY, {
            url: `${configuration.protocol}://${hostname}:${port}/`,
            port,
            http2
          })
        })
    })
    .catch(reason => {
      failed(reason)
      emit(EVENT_ERROR, { reason })
    })
  instance.close = function () {
    return serverAvailable
      .then(server => {
        return new Promise(resolve => server.close(() => resolve()))
      })
  }
  return instance
}
