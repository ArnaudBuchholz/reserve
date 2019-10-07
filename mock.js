'use strict'

const { check } = require('./configuration')
const dispatcher = require('./dispatcher')
const EventEmitter = require('events')
const Request = require('./tests/mocha/Request')
const Response = require('./tests/mocha/Response')

module.exports = (jsonConfiguration, mockedHandlers = {}) => {
  const eventEmitter = new EventEmitter()
  check(jsonConfiguration)
    .then(configuration => {
      Object.assign(configuration.handlers, mockedHandlers)
      const dispatch = dispatcher.bind(eventEmitter, configuration)
      eventEmitter.request = (method = 'GET', url = '/', headers = {}, body = '') => {
        const request = new Request(method, url, headers, body)
        const response = new Response()
        return dispatch(request, response).then(() => response)
      }
      eventEmitter.emit('ready', {
        url: `${configuration.protocol}://${configuration.hostname}:${configuration.port}/`
      })
    })
    .catch(reason => eventEmitter.emit('error', { reason }))
  return eventEmitter
}
