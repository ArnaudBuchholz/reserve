'use strict'

module.exports = async function (response, data, options = {}) {
  const { statusCode = 200 } = options
  const headers = { ...options.headers }
  if (typeof data === 'string') {
    headers['content-type'] = 'text/plain'
  } else if (typeof data === 'object') {
    headers['content-type'] = 'application/json'
    data = JSON.stringify(data)
  }
  headers['content-length'] = (new TextEncoder().encode(data)).length
  response.writeHead(statusCode, headers)
  response.end(data)
}
