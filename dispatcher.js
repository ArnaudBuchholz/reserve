'use strict'

function redirected () {
  const end = new Date()
  this.eventEmitter.emit('redirected', Object.assign(this.emitParameters, {
    end,
    timeSpent: end - this.emitParameters.start,
    statusCode: this.response.statusCode
  }))
}

function error (reason) {
  this.eventEmitter.emit('error', { ...this.emitParameters, reason })
  return dispatch.call(this, 500)
}

function redirecting ({ mapping, match, handler, type, redirect }) {
  this.eventEmitter.emit('redirecting', Object.assign(this.emitParameters, { type, redirect }))
  try {
    return handler.redirect({ mapping, match, redirect, request: this.request, response: this.response })
      .then(result => {
        if (undefined === result) {
          // Assuming the request is terminated (else should call dispatch())
          redirected.call(this)
        } else {
          return dispatch.call(this, result)
        }
      }, error.bind(this))
  } catch (e) {
    return error.call(this, e)
  }
}

function dispatch (url, index = 0) {
  if (typeof url === 'number') {
    return redirecting.call(this, {
      type: 'status',
      handler: this.configuration.handlers.status,
      redirect: url
    })
  }
  if (index === this.configuration.mappings.length) {
    return error.call(this, 'no mapping')
  }
  const mapping = this.configuration.mappings[index]
  const match = mapping.match.exec(url)
  if (!match) {
    return dispatch.call(this, url, index + 1)
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
  return redirecting.call(this, { mapping, match, handler, type, redirect })
}

module.exports = function (configuration, request, response) {
  const emitParameters = {
    method: request.method,
    url: request.url,
    start: new Date()
  }
  this.emit('incoming', emitParameters)
  dispatch.call({
    eventEmitter: this,
    emitParameters,
    configuration,
    request,
    response
  }, request.url)
}
