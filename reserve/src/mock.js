'use strict'

const { check } = require('./config/configuration')
const dispatcher = require('./dispatcher')
const { newEventEmitter, EVENT_CREATED, EVENT_READY, EVENT_ERROR } = require('./event')
const Request = require('./mock/Request')
const Response = require('./mock/Response')
const {
  $configurationEventEmitter,
  $configurationInterface
} = require('./symbols')
const getHostName = require('./helpers/hostname')
const close = require('./close')

module.exports = (jsonConfiguration, mockedHandlers) => {
  const { on, emit } = newEventEmitter()
  let configuration
  const instance = {
    on,
    async close (options) {
      if (configuration) {
        await close(configuration, options)
      }
    }
  }
  check(jsonConfiguration, mockedHandlers)
    .then(checkedConfiguration => {
      configuration = checkedConfiguration
      configuration[$configurationEventEmitter] = emit
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
    .catch(error => {
      emit(EVENT_ERROR, { error })
    })
  return instance
}
