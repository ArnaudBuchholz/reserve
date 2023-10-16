'use strict'

const EventEmitter = require('events')
const echo = 'http://www.mocked.com/echo'
const echos = 'https://www.mocked.com/echo'

module.exports = {

  urls: {
    echo,
    echos
  },

  request: (url, options, callback) => {
    const Response = require('../../src/mock/Response')
    const result = new EventEmitter()
    const response = new Response()
    const statusCode = options.headers['x-status-code']
    response.writeHead(statusCode, {
      connection: 'close',
      ...options.headers
    })
    result.write = chunk => {
      response.write(chunk)
    }
    result.end = () => {
      response.end()
      callback(response)
    }
    return result
  },

  createServer: () => {
    const simulatedAddress = {}
    return {
      listen: (port, hostname, callback) => {
        if (port === 0) {
          port = 34750
        }
        simulatedAddress.port = port
        if (hostname === 'error') {
          callback(new Error('error'))
        } else {
          callback(null)
        }
      },
      close: function (callback) {
        this._closed = true
        callback()
      },
      address: () => simulatedAddress
    }
  }
}
