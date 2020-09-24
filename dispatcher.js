'use strict'

const logError = require('./logError')
const interpolate = require('./interpolate')
const {
  $configurationInterface,
  $configurationRequests,
  $dispatcherEnd,
  $mappingMatch,
  $requestId,
  $requestPromise,
  $requestRedirectCount,
  $responseEnded
} = require('./symbols')

function hookEnd (response) {
  if (!response.end[$dispatcherEnd]) {
    const end = response.end
    response.end = function () {
      this[$responseEnded] = true
      return end.apply(this, arguments)
    }
    response.end[$dispatcherEnd] = true
  }
  return response
}

function emit (event, emitParameters, additionalParameters) {
  this.emit(event, { ...emitParameters, ...additionalParameters })
}

function emitError (reason) {
  try {
    emit.call(this.eventEmitter, 'error', this.emitParameters, { reason })
  } catch (e) {
    logError({ ...this.emitParameters, reason: e }) // Unhandled error
  }
}

function redirected () {
  const end = new Date()
  try {
    emit.call(this.eventEmitter, 'redirected', this.emitParameters, {
      end,
      timeSpent: end - this.emitParameters.start,
      statusCode: this.response.statusCode
    })
  } catch (reason) {
    emitError.call(this, reason)
  }
  this.resolve()
}

function error (reason) {
  let statusCode
  if (typeof reason === 'number') {
    statusCode = reason
  } else {
    statusCode = 500
  }
  emitError.call(this, reason)
  if (this.failed) {
    // Error during error: finalize the response (whatever it means)
    this.response.end()
    return redirected.call(this)
  }
  this.failed = true
  return dispatch.call(this, statusCode)
}

function redirecting ({ mapping, match, handler, type, redirect, url, index = 0 }) {
  try {
    emit.call(this.eventEmitter, 'redirecting', this.emitParameters, { type, redirect })
    return handler.redirect({
      configuration: this.configuration[$configurationInterface],
      mapping,
      match,
      redirect,
      request: this.request,
      response: hookEnd(this.response)
    })
      .then(result => {
        if (undefined !== result) {
          const redirectCount = ++this.request[$requestRedirectCount]
          if (redirectCount > this.configuration['max-redirect']) {
            return error.call(this, 508)
          }
          return dispatch.call(this, result)
        }
        if (this.response[$responseEnded]) {
          return redirected.call(this)
        }
        return dispatch.call(this, url, index + 1)
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
  const length = this.configuration.mappings.length
  while (index < length) {
    const mapping = this.configuration.mappings[index]
    const match = mapping[$mappingMatch](this.request.method, url)
    if (match) {
      const { handler, redirect, type } = this.configuration.handler(mapping)
      return redirecting.call(this, { mapping, match, handler, type, redirect: interpolate(match, redirect), url, index })
    }
    ++index
  }
  return error.call(this, 501)
}

module.exports = function (configuration, request, response) {
  const configurationRequests = configuration[$configurationRequests]
  const emitParameters = { id: ++configurationRequests.lastId, method: request.method, url: request.url, start: new Date() }
  let promiseResolver
  const requestPromise = new Promise(resolve => { promiseResolver = resolve })
  const context = { eventEmitter: this, emitParameters, configuration, request, response, resolve: promiseResolver }
  request[$requestId] = emitParameters.id
  request[$requestPromise] = requestPromise
  request[$requestRedirectCount] = 0
  request.on('aborted', emit.bind(this, 'aborted', emitParameters))
  request.on('close', emit.bind(this, 'closed', emitParameters))
  try {
    emit.call(this, 'incoming', emitParameters)
  } catch (reason) {
    error.call(context, reason)
    return requestPromise
  }
  return configurationRequests.hold
    .then(() => {
      configurationRequests.promises.push(requestPromise)
      dispatch.call(context, request.url)
      return requestPromise
    })
    .then(() => {
      configurationRequests.promises = configurationRequests.promises
        .filter(promise => promise !== requestPromise)
    })
}
