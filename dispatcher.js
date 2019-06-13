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

function process ({emitParameters, configuration, request, response, url}) {
  emitParameters.url = url
  this.emit('processing', emitParameters)
  if (configuration.mappings.every(mapping => {
    const match = mapping.match.exec(url)
    if (match) {
      let {
        handler,
        redirect,
        type
      } = configuration.handler(mapping)
      if (typeof redirect === 'string') {
        for (let capturingGroupIndex = match.length; capturingGroupIndex > 0; --capturingGroupIndex) {
          redirect = redirect.replace(new RegExp(`\\$${capturingGroupIndex}`, 'g'), match[capturingGroupIndex])
        }
      }
      this.emit('redirecting', Object.assign(emitParameters, { type, redirect }))
      try {
          handler.redirect({ mapping, match, redirect, request, response })
            .then(() => {
              const end = new Date()
              this.emit('redirected', Object.assign(emitParameters, {
                end,
                timeSpent: end - emitParameters.start,
                statusCode: response.statusCode
              }))
            }, reason => {
              error(request, response, reason.toString())
              this.emit('error', {...emitParameters, reason})
            })
      } catch (e) {

      }
      return false
    }
    return true
  })) {
    this.emit('error', {...emitParameters, reason: 'no mapping'})
    process({emitParameters, configuration, request, response, 500})
  }
}

module.exports = function (configuration, request, response) {
  const emitParameters = {
    method: request.method,
    url: request.url,
    start: new Date(),
    incomingUrl: request.url
  }
  this.emit('incoming', emitParameters)
  process.call(this, {
    emitParameters,
    configuration,
    request,
    response
  })
}
