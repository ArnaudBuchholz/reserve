'use strict'

module.exports = function (request, options = {}) {
  let type
  const promise = new Promise((resolve, reject) => {
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
  promise.buffer = () => promise
  promise.text = () => {
    return promise.then(buffer => buffer.toString())
  }
  promise.json = () => {
    return promise.then(buffer => JSON.parse(buffer.toString()))
  }
  return promise
}
