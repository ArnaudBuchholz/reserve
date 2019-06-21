'use strict'

const EventEmitter = require('events')
const Response = require('./Response')
const empty = 'http://www.mocked.com/empty'

module.exports = {

  urls: {
    empty
  },

  request: (url, options, callback) => {
    const eventEmitter = new EventEmitter()
    const response = new Response(200)
    if (url === empty) {
      callback(response)
    }
    return eventEmitter
  }

}
