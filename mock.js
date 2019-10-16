'use strict'

const { check } = require('./configuration')
const dispatcher = require('./dispatcher')
const EventEmitter = require('events')
const Request = require('./mock/Request')
const Response = require('./mock/Response')

module.exports = (jsonConfiguration, mockedHandlers = {}) => {
  const eventEmitter = new EventEmitter()
  return check(jsonConfiguration)
    .then(configuration => {
      Object.assign(configuration.handlers, mockedHandlers)
      const dispatch = dispatcher.bind(eventEmitter, configuration)
      eventEmitter.request = (method, url, headers = {}, body = '') => {
        const request = new Request(method, url, headers, body)
        const response = new Response()
        return dispatch(request, response).then(() => response)
      }
      return eventEmitter
    })
}
