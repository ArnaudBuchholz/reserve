'use strict'

const { http, http2, https } = require('./node-api')
const { newEventEmitter, EVENT_CREATED, EVENT_READY, EVENT_ERROR } = require('./event')
const { check } = require('./config/configuration')
const dispatcher = require('./dispatcher')
const {
  $configurationEventEmitter,
  $configurationInterface
} = require('./symbols')
const getHostName = require('./helpers/hostname')
const portIsUsed = require('./helpers/portIsUsed')
const { throwError, ERROR_SERVE_PORT_ALREADY_USED } = require('./error')

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
  let server
  const instance = {
    on,
    async close () {
      if (server) {
        await new Promise(resolve => server.close(() => resolve()))
        /* istanbul ignore next */ // Depends on Node.js version
        server.closeIdleConnections && server.closeIdleConnections()
        // go over configuration's remaining contexts
        // server.closeAllConnections && server.closeAllConnections()
      }
    }
  }
  check(jsonConfiguration)
    .then(async configuration => {
      let port = configuration.port
      if (port !== 0 && await portIsUsed(port)) {
        throwError(ERROR_SERVE_PORT_ALREADY_USED, { port })
      }
      configuration[$configurationEventEmitter] = emit
      configuration.listeners.forEach(listen => listen(instance))
      server = await createServerAsync(emit, configuration, dispatcher)
      const hostname = configuration.hostname || getHostName()
      port = server.address().port
      const { http2 } = configuration
      emit(EVENT_READY, {
        url: `${configuration.protocol}://${hostname}:${port}/`,
        port,
        http2
      })
    })
    .catch(reason => {
      emit(EVENT_ERROR, { reason })
    })
  return instance
}
