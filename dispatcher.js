'use strict'

const mime = require('mime')

function redirected () {
  const end = new Date()
  this.eventEmitter.emit('redirected', Object.assign(this.emitParameters, {
    end,
    timeSpent: end - this.emitParameters.start,
    statusCode: this.response.statusCode
  }))
}

const textMimeType = mime.getType('text')

const byStatus = {
  '403': () => 'Forbidden',
  '404': () => 'Not found',
  '500': () => 'Internal Server Error'
}

async function status (statusCode) {
  const content = byStatus[statusCode](this.request) || ''
  const length = content.length
  this.response.writeHead(500, {
    'Content-Type': textMimeType,
    'Content-Length': length
  })
  this.response.end(content)
  redirected.call(this)
}

function error (reason) {
  this.eventEmitter.emit('error', {...this.emitParameters, reason})
  return process.call(this, 500)
}

function next (url, index = 0) {
  if (index === this.configuration.mappings.length) {
    return error.call(this, 'no mapping')
  }
  const mapping = this.configuration.mappings[index]
  const match = mapping.match.exec(url)
  if (!match) {
    return next.call(this, url, index + 1)
  }
  let {
    handler,
    redirect,
    type
  } = this.configuration.handler(mapping)
  if (typeof redirect === 'string') {
    for (let capturingGroupIndex = match.length; capturingGroupIndex > 0; --capturingGroupIndex) {
      redirect = redirect.replace(new RegExp(`\\$${capturingGroupIndex}`, 'g'), match[capturingGroupIndex])
    }
  }
  this.eventEmitter.emit('redirecting', Object.assign(this.emitParameters, { type, redirect }))
  try {
    return handler.redirect({ mapping, match, redirect, request: this.request, response: this.response })
        .then(result => {
          if (undefined === result) {
            // Assuming the request is terminated (else should call next())
            redirected.call(this)
          } else {
            return process.call(this, result)
          }
        }, error.bind(this))
  } catch (e) {
    return error.call(this, e)
  }
}

function process (url) {
  this.eventEmitter.emit('processing', this.emitParameters)
  if (typeof url === 'number') {
    return status.call(this, url)
  }
  return next.call(this, url)
}

module.exports = function (configuration, request, response) {
  const emitParameters = {
    method: request.method,
    url: request.url,
    start: new Date(),
  }
  this.emit('incoming', emitParameters)
  process.call({
    eventEmitter: this,
    emitParameters,
    configuration,
    request,
    response
  }, request.url)
}
