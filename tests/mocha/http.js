'use strict'

const EventEmitter = require('events')
const Response = require('./Response')
const empty = 'http://www.mocked.com/empty'
const echo = 'http://www.mocked.com/echo'

module.exports = {

  urls: {
    empty,
    echo
  },

  request: (url, options, callback) => {
    const eventEmitter = new EventEmitter()
    const response = new Response()
    if (url === empty) {
      response.writeHead(200)
    } else if (url === echo) {
      const statusCode = options.headers['x-status-code']
      response.writeHead(statusCode, options.headers)
    }
    eventEmitter.end = () => {
      callback(response)
    }
    return eventEmitter
  }

}
