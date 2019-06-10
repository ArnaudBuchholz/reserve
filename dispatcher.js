'use strict'

const mime = require('mime')

const textMimeType = mime.getType('text')

function error (request, response, message) {
  const content = `An error occurred while processing ${request.method} ${request.url}: ${message}`
  const length = content.length
  response.writeHead(500, {
    'Content-Type': textMimeType,
    'Content-Length': length
  })
  response.end(content)
}

module.exports = function (configuration, request, response) {
  if (configuration.verbose) {
    this.emit('incoming', {
      method: request.method,
      url: request.url
    })
  }
  if (configuration.mappings.every(mapping => {
    const match = mapping.match.exec(request.url)
    if (match) {
      request.mapping = mapping
      request.match = match
      let redirect
      let type
      if (types.every(member => {
        type = member
        redirect = mapping[member]
        return !redirect
      })) {
        error.(request, response, 'no mapping')
        this.emit('error-no-mapping')
        return false
      }
      if (typeof redirect === 'string') {
        for (let capturingGroupIndex = match.length; capturingGroupIndex > 0; --capturingGroupIndex) {
          redirect = redirect.replace(new RegExp(`\\$${capturingGroupIndex}`, 'g'), match[capturingGroupIndex])
        }
      }
      this.emit('redirecting', {
        method: request.method,
        url: request.url,
        type,
        redirect
      })
      typeHandlers[type](request, response)
        .then(() => {
          this.emit('redirected', {
            method: request.method,
            url: request.url,
            type,
            redirect
          })
        }, reason => {
          error(request, response, reason.toString())
          this.emit('error-redirecting', reason)
        })
      return false
    }
    return true
  })) {
    error(request, response, { message: 'not mapped' })
  }
}
