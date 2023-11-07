'use strict'

const { body } = require('../src/index')

module.exports = async (request, response, text) => {
  if (request.method === 'POST') {
    text = await body(request)
  }
  response.writeHead(200, {
    'Content-Type': 'text/plain',
    'Content-Length': text.length
  })
  response.end(text)
}
