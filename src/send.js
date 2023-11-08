'use strict'

const { pipeline } = require('./node-api')

const CONTENT_TYPE = 'content-type'
const CONTENT_LENGTH = 'content-length'

module.exports = async function (response, data, options = {}) {
  const { statusCode = 200, noBody } = options
  const headers = { ...options.headers }
  let stream = false
  let contentType
  if (typeof data === 'string') {
    contentType = 'text/plain'
  } else if (typeof data.on === 'function') {
    contentType = 'application/octet-stream'
    stream = true
  } else {
    contentType = 'application/json'
    data = JSON.stringify(data)
  }
  headers[CONTENT_TYPE] ||= contentType
  if (!stream) {
    headers[CONTENT_LENGTH] ||= (new TextEncoder().encode(data)).length
  }
  response.writeHead(statusCode, headers)
  if (noBody) {
    response.end()
  } else if (stream) {
    return new Promise((resolve, reject) => {
      response.on('finish', resolve)
      data.on('error', reject)
      pipeline(data, response, err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  } else {
    response.end(data)
  }
}
