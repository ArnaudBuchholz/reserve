'use strict'

const logError = require('./logError')
const $ended = Symbol('REserve:ended')

function redirected () {
  const end = new Date()
  const redirectedInfos = Object.assign(this.emitParameters, {
    end,
    timeSpent: end - this.emitParameters.start,
    statusCode: this.response.statusCode
  })
  this.eventEmitter.emit('redirected', redirectedInfos)
  this.resolve(redirectedInfos)
}

function error (reason) {
  const errorParameters = { ...this.emitParameters, reason }
  try {
    this.eventEmitter.emit('error', errorParameters)
  } catch (e) {
    // Unhandled error
    logError(errorParameters)
  }
  return dispatch.call(this, 500)
}

function redirecting ({ mapping, match, handler, type, redirect, url, index = 0 }) {
  this.eventEmitter.emit('redirecting', Object.assign(this.emitParameters, { type, redirect }))
  try {
    return handler.redirect({ configuration: this.configuration, mapping, match, redirect, request: this.request, response: this.response })
      .then(result => {
        if (undefined !== result) {
          return dispatch.call(this, result)
        }
        if (this.response[$ended]) {
          return redirected.call(this)
        }
        return dispatch.call(this, url, index + 1)
      }, error.bind(this))
  } catch (e) {
    return error.call(this, e)
  }
}

function interpolate (match, redirect) {
  if (typeof redirect === 'string') {
    return redirect.replace(/\$(\d+|\$)/g, (token, sIndex) => {
      if (sIndex === '$') {
        return '$'
      } else {
        return match[sIndex] || ''
      }
    })
  }
  return redirect
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
  const { handler, redirect, type } = this.configuration.handler(mapping)
  return redirecting.call(this, { mapping, match, handler, type, redirect: interpolate(match, redirect), url, index })
}

function hookEnd (response) {
  const end = response.end
  response.end = function () {
    this[$ended] = true
    return end.apply(this, arguments)
  }
}

module.exports = function (configuration, request, response) {
  const emitParameters = {
    method: request.method,
    url: request.url,
    start: new Date()
  }
  let dispatchResolver
  const promise = new Promise(resolve => {
    dispatchResolver = resolve
  })
  this.emit('incoming', emitParameters)
  hookEnd(response)
  dispatch.call({
    eventEmitter: this,
    emitParameters,
    configuration,
    request,
    response,
    resolve: dispatchResolver
  }, request.url)
  return promise
}
