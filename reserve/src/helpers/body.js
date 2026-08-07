'use strict'

const { text, json } = require('../mime')
const defer = require('./defer')
const { $bodyCache } = require('../symbols')

module.exports = function (request, options = {}) {
  if (request[$bodyCache] !== undefined) {
    const cached = Promise.resolve(request[$bodyCache])
    const toText = buffer => buffer.toString()
    const toJson = buffer => JSON.parse(buffer.toString())
    cached.buffer = () => cached
    cached.text = () => cached.then(toText)
    cached.json = () => cached.then(toJson)
    return cached
  }
  let type
  const [readBuffer, resolve, reject] = defer()
  request.on('error', reject)
  const { ignoreContentLength = false } = options
  const contentLength = !ignoreContentLength && request.headers && request.headers['content-length']
  const contentType = request.headers && request.headers['content-type']
  if (contentType) {
    if (contentType.startsWith(text)) {
      type = text
    } else if (contentType.startsWith(json)) {
      type = json
    }
  }
  if (contentLength) {
    const length = parseInt(contentLength, 10)
    const buffer = Buffer.alloc(length)
    let pos = 0
    request
      .on('data', chunk => {
        chunk.copy(buffer, pos)
        pos += chunk.length
      })
      .on('end', () => resolve(buffer))
  } else {
    const buffers = []
    request
      .on('data', chunk => buffers.push(chunk))
      .on('end', () => resolve(Buffer.concat(buffers)))
  }
  readBuffer.then(buffer => {
    request[$bodyCache] = buffer
  })
  const toText = buffer => buffer.toString()
  const toJson = buffer => JSON.parse(buffer.toString())
  let promise
  if (type === text) {
    promise = readBuffer.then(toText)
  } else if (type === json) {
    promise = readBuffer.then(toJson)
  } else {
    promise = readBuffer
  }
  promise.buffer = () => readBuffer
  promise.text = () => readBuffer.then(toText)
  promise.json = () => readBuffer.then(toJson)
  return promise
}
