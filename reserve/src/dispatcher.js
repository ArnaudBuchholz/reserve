'use strict'

const logError = require('./logError')
const interpolate = require('./interpolate')
const {
  $configurationInterface,
  $configurationRequests,
  $mappingMatch,
  $requestId,
  $requestInternal,
  $handlerPrefix
} = require('./symbols')

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

function redirected (/* this: context */) {
  const perfEnd = performance.now()
  Object.assign(this.emitParameters, {
    end: new Date(),
    perfEnd,
    timeSpent: Math.ceil(perfEnd - this.emitParameters.perfStart),
    statusCode: this.response.statusCode
  })
  try {
    emit.call(this.eventEmitter, 'redirected', this.emitParameters)
  } catch (reason) {
    emitError.call(this, reason)
  }
  this.redirected()
}

function error (reason) {
  let statusCode
  if (typeof reason === 'number') {
    statusCode = reason
  } else {
    statusCode = 500
  }
  emitError.call(this, reason)
  if (this.request.aborted) {
    redirected.call(this) // TODO maybe a better status
  } else if (this.failed) {
    // Error during error: finalize the response (whatever it means)
    this.response.end()
    redirected.call(this)
  } else {
    this.failed = true
    dispatch.call(this, statusCode)
  }
}

function redispatch (url) {
  const redirectCount = ++this.redirectCount
  if (redirectCount > this.configuration['max-redirect']) {
    error.call(this, 508)
  } else {
    dispatch.call(this, url)
  }
}

async function redirecting (/* this: context, */ { mapping = {}, match, handler, type, redirect, url, index = 0 }) {
  try {
    const prefix = handler[$handlerPrefix] || 'external'
    const start = performance.now()
    emit.call(this.eventEmitter, 'redirecting', this.emitParameters, { type, redirect })
    if (mapping['exclude-from-holding-list']) {
      this.nonHolding = true
      this.holding = Promise.resolve()
    }
    let result = handler.redirect({
      configuration: this.configuration[$configurationInterface],
      mapping,
      match,
      redirect,
      request: this.request,
      response: this.response
    })
    if (result && result.then) {
      result = await result
    }
    const end = performance.now()
    this.emitParameters.perfHandlers.push({
      prefix,
      start,
      end
    })
    if (result !== undefined) {
      redispatch.call(this, result)
    } else if (this.ended) {
      redirected.call(this)
    } else {
      dispatch.call(this, url, index + 1)
    }
  } catch (e) {
    error.call(this, e)
  }
}

async function dispatch (url, index = 0) {
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
    let match
    try {
      match = mapping[$mappingMatch](this.request, url)
      if (match && match.then) {
        match = await match
      }
    } catch (reason) {
      return error.call(this, reason)
    }
    if (match) {
      if (['string', 'number'].includes(typeof match)) {
        return redispatch.call(this, match)
      }
      const { handler, redirect, type } = this.configuration.handler(mapping)
      return redirecting.call(this, { mapping, match, handler, type, redirect: interpolate(match, redirect), url, index })
    }
    ++index
  }
  error.call(this, 501)
}

function hookedEnd (/* this: context, */ ...args) {
  const {
    configuration,
    id,
    nativeEnd,
    response
  } = this
  this.ended = true
  const { contexts } = configuration[$configurationRequests]
  delete contexts[id]
  return nativeEnd.apply(response, args)
}

module.exports = async function (configuration, request, response) {
  const configurationRequests = configuration[$configurationRequests]
  const { contexts } = configurationRequests
  const id = ++configurationRequests.lastId

  const emitParameters = {
    id,
    internal: !!request[$requestInternal],
    method: request.method,
    url: request.url,
    headers: { ...request.headers },
    start: new Date(),
    perfStart: performance.now(),
    perfHandlers: []
  }

  let dispatched
  const dispatching = new Promise(resolve => { dispatched = resolve })

  const context = {
    configuration,
    eventEmitter: this,
    emitParameters,
    holding: dispatching,
    nativeEnd: response.end,
    ended: false,
    redirectCount: 0,
    redirected: dispatched,
    request,
    response
  }

  response.end = hookedEnd.bind(context)
  request[$requestId] = id
  request.on('aborted', emit.bind(this, 'aborted', emitParameters))
  request.on('close', emit.bind(this, 'closed', emitParameters))

  try {
    emit.call(this, 'incoming', emitParameters)
  } catch (reason) {
    error.call(context, reason)
    return dispatching
  }

  if (configurationRequests.holding) {
    await configurationRequests.holding
  }

  contexts[id] = context
  dispatch.call(context, request.url)
  return dispatching
}
