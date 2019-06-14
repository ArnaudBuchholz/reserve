'use strict'

/* global process */

module.exports = (request, response, status) => {
  if (process.send) {
    process.send(status)
  }
  response.writeHead(200, {
    'Content-Type': 'text/plain',
    'Content-Length': 0
  })
  response.end()
}
