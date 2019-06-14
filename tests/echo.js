'use strict'

module.exports = (request, response, text) => {
  response.writeHead(200, {
    'Content-Type': 'text/plain',
    'Content-Length': text.length
  })
  response.end(text)
}
