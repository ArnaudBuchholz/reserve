'use strict'

const logError = require('./logError')
const interpolate = require('./interpolate')
const {
  EVENT_INCOMING,
  EVENT_ERROR,
  EVENT_REDIRECTING,
  EVENT_REDIRECTED,
  EVENT_ABORTED,
  EVENT_CLOSED
} = require('./event')
const {
  $configurationInterface,
  $configurationRequests,
  $mappingMatch,
  $requestId,
  $requestInternal,
  $configurationEventEmitter
} = require('./symbols')

function emitError ({ emit, emitParameters }, reason) {
  const handled = emit(EVENT_ERROR, emitParameters, { reason })
  if (!handled) {
    logError({ ...emitParameters, reason }) // Unhandled error
  }
}

function redirected (context) {
  const { emit, emitParameters, response: { statusCode }, redirected, configuration: { [$configurationRequests]: contexts }, id } = context
  const perfEnd = performance.now()
  emitParameters.end = new Date()
  emitParameters.perfEnd = perfEnd
  emitParameters.timeSpent = Math.ceil(perfEnd - emitParameters.perfStart)
  emitParameters.statusCode = statusCode
  emit(EVENT_REDIRECTED, emitParameters)
  delete contexts[id]
  redirected()
}

function error (context, reason) {
  let statusCode
  if (typeof reason === 'number') {
    statusCode = reason
  } else {
    statusCode = 500
  }
  emitError(context, reason)
  /* istanbul ignore if */ // Not sure how to test
  if (context.request.aborted) {
    redirected(context) // TODO maybe a better status
  } else if (context.failed) {
    // Error during error: finalize the response (whatever it means)
    context.response.end()
    redirected(context)
  } else {
    context.failed = true
    dispatch(context, statusCode)
  }
}

function redispatch (context, url) {
  if (++context.redirectCount > context.configuration['max-redirect']) {
    error(context, 508)
  } else {
    dispatch(context, url)
  }
}

function handled (context, { url, index }, result) {
  if (result !== undefined) {
    redispatch(context, result)
  } else if (context.response.writableEnded) {
    redirected(context)
  } else {
    dispatch(context, url, index + 1)
  }
}

function redirecting (context, { mapping = {}, match, handler, type, redirect, url, index = 0 }) {
  try {
    const { configuration, request, response, emit, emitParameters } = context
    emit(EVENT_REDIRECTING, emitParameters, { type, redirect })
    if (mapping['exclude-from-holding-list']) {
      context.nonHolding = true
      context.holding = Promise.resolve()
    }
    const result = handler.redirect({
      configuration: configuration[$configurationInterface],
      mapping,
      match,
      redirect,
      request,
      response
    })
    if (result && result.then) {
      result.then(handled.bind(null, context, { url, index }), reason => error(context, reason))
    } else {
      handled(context, { url, index }, result)
    }
  } catch (e) {
    error(context, e)
  }
}

function dispatch (context, url, index = 0) {
  const { configuration } = context
  if (typeof url === 'number') {
    return redirecting(context, {
      type: 'status',
      handler: configuration.handlers.status,
      redirect: url
    })
  }
  try {
    const { mappings } = configuration
    const { length } = mappings
    while (index < length) {
      const mapping = mappings[index]
      const match = mapping[$mappingMatch](context.request, url)
      if (match) {
        if (['string', 'number'].includes(typeof match)) {
          return redispatch(context, match)
        }
        const { handler, redirect, type } = configuration.handler(mapping)
        return redirecting(context, { mapping, match, handler, type, redirect: interpolate(match, redirect), url, index })
      }
      ++index
    }
    error(context, 501)
  } catch (reason) {
    error(context, reason)
  }
}

module.exports = function (configuration, request, response) {
  const {
    [$configurationRequests]: configurationRequests,
    [$configurationEventEmitter]: emit
  } = configuration
  const { contexts } = configurationRequests
  const id = ++configurationRequests.lastId

  const emitParameters = {
    id,
    internal: !!request[$requestInternal],
    method: request.method,
    url: request.url,
    headers: { ...request.headers },
    start: new Date(),
    perfStart: performance.now()
  }

  let dispatched
  const dispatching = new Promise(resolve => { dispatched = resolve })

  const context = {
    configuration,
    emit,
    emitParameters,
    holding: dispatching,
    redirectCount: 0,
    redirected: dispatched,
    request,
    response
  }

  request[$requestId] = id
  request.on('aborted', () => emit(EVENT_ABORTED, emitParameters))
  request.on('close', () => emit(EVENT_CLOSED, emitParameters))

  emit(EVENT_INCOMING, emitParameters)

  contexts[id] = context

  if (configurationRequests.holding) {
    configurationRequests.holding.then(() => dispatch(context, request.url))
  } else {
    dispatch(context, request.url)
  }

  return dispatching
}
