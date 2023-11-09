'use strict'

module.exports = function (request, options = {}) {
  let type
  const readBuffer = new Promise((resolve, reject) => {
    request.on('error', reject)
    const { ignoreContentLength = false } = options
    const contentLength = !ignoreContentLength && request.headers && request.headers['content-length']
    const contentType = request.headers && request.headers['content-type']
    if (contentType) {
      if (contentType.startsWith('text/plain')) {
        type = 'text'
      } else if (contentType.startsWith('application/json')) {
        type = 'json'
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
  })
  const toText = buffer => buffer.toString()
  const toJson = buffer => JSON.parse(buffer.toString())
  let promise
  if (type === 'text') {
    promise = readBuffer.then(toText)
  } else if (type === 'json') {
    promise = readBuffer.then(toJson)
  } else {
    promise = readBuffer
  }
  promise.buffer = () => readBuffer
  promise.text = () => readBuffer.then(toText)
  promise.json = () => readBuffer.then(toJson)
  return promise
}
