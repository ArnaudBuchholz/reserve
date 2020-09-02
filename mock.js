'use strict'

const { check } = require('./configuration')
const dispatcher = require('./dispatcher')
const EventEmitter = require('events')
const Request = require('./mock/Request')
const Response = require('./mock/Response')
const { $configurationInterface } = require('./symbols')

module.exports = (jsonConfiguration, mockedHandlers = {}) => {
  const eventEmitter = new EventEmitter()
  return check(jsonConfiguration)
    .then(configuration => {
      Object.assign(configuration.handlers, mockedHandlers)
      configuration.listeners.forEach(listener => listener(eventEmitter))
      eventEmitter.emit('server-created', {
        configuration: configuration[$configurationInterface],
        server: null
      })
      const dispatch = dispatcher.bind(eventEmitter, configuration)
      eventEmitter.request = function () {
        const request = new Request(...arguments)
        const response = new Response()
        const finished = response.waitForFinish()
        return dispatch(request, response)
          .then(() => finished)
      }
      return eventEmitter
    })
}
