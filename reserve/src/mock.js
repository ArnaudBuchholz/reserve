'use strict'

const { check } = require('./configuration')
const dispatcher = require('./dispatcher')
const { newEventEmitter, EVENT_CREATED, EVENT_READY } = require('./EventEmitter')
const Request = require('./mock/Request')
const Response = require('./mock/Response')
const {
  $configurationEventEmitter,
  $configurationInterface
} = require('./symbols')
const getHostName = require('./hostname')

module.exports = (jsonConfiguration, mockedHandlers = {}) => {
  const { on, emit } = newEventEmitter()
  const instance = {
    on,
    close: () => Promise.resolve()
  }
  check(jsonConfiguration)
    .then(configuration => {
      configuration[$configurationEventEmitter] = emit
      Object.assign(configuration.handlers, mockedHandlers)
      configuration.listeners.forEach(listen => listen(instance))
      emit(EVENT_CREATED, {
        configuration: configuration[$configurationInterface],
        server: null
      })
      const dispatch = dispatcher.bind(null, configuration)
      instance.request = function () {
        const request = new Request(...arguments)
        const response = new Response()
        const finished = response.waitForFinish()
        return dispatch(request, response)
          .then(() => finished)
      }
      const hostname = configuration.hostname || getHostName()
      const { port, http2 } = configuration
      emit(EVENT_READY, {
        url: `${configuration.protocol}://${hostname}:${port}/`,
        port,
        http2
      })
    })
  return instance
}
