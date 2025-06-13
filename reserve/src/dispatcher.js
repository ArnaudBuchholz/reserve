'use strict'

const { performance } = require('./node-api')
const logError = require('./log/logError')
const interpolate = require('./helpers/interpolate')
const normalize = require('./helpers/normalize')
const {
  EVENT_INCOMING,
  EVENT_ERROR,
  EVENT_REDIRECTING,
  EVENT_REDIRECTED,
  EVENT_ABORTED,
  EVENT_CLOSED
} = require('./event')
const {
  $configurationClosed,
  $configurationInterface,
  $configurationRequests,
  $mappingMatch,
  $mappingHandler,
  $requestInternal,
  $requestContext,
  $configurationEventEmitter
} = require('./symbols')
const defer = require('./helpers/defer')
const status = require('./handlers/status')

function emitError ({ emit, emitParameters }, reason) {
  const handled = emit(EVENT_ERROR, emitParameters, { reason })
  if (!handled) {
    logError({ ...emitParameters, reason }) // Unhandled error
  }
}

function redirected (context) {
  const { emit, emitParameters, response: { statusCode }, redirected } = context
  const perfEnd = performance.now()
  emitParameters.end = new Date()
  emitParameters.perfEnd = perfEnd
  emitParameters.timeSpent = Math.ceil(perfEnd - emitParameters.perfStart)
  emitParameters.statusCode = statusCode
  emit(EVENT_REDIRECTED, emitParameters)
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
  return evaluateMappings(context, url, index)
}

function evaluateMappings (context, url, index) {
  try {
    const { mappings } = context.configuration
    const { length } = mappings
    while (index < length) {
      const mapping = mappings[index]
      const match = mapping[$mappingMatch](url, context.request)
      if (match) {
        if (match.then) {
          match
            .then(asyncMatch => {
              if (asyncMatch) {
                const { handler, redirect, type } = mapping[$mappingHandler]
                redirecting(context, { mapping, match: asyncMatch, handler, type, redirect: interpolate(asyncMatch, redirect), url, index })
              } else {
                evaluateMappings(context, url, index + 1)
              }
            })
            .catch(reason => error(context, reason))
          return
        }
        const { handler, redirect, type } = mapping[$mappingHandler]
        return redirecting(context, { mapping, match, handler, type, redirect: interpolate(match, redirect), url, index })
      }
      ++index
    }
    error(context, 501)
  } catch (reason) {
    error(context, reason)
  }
}

function onAborted () {
  const { emit, emitParameters } = this[$requestContext]
  emit(EVENT_ABORTED, emitParameters)
}

function onClose () {
  const { emit, emitParameters, configuration: { [$configurationRequests]: { contexts } }, id } = this[$requestContext]
  emit(EVENT_CLOSED, emitParameters)
  contexts.delete(id)
}

module.exports = function (configuration, request, response) {
  if (configuration[$configurationClosed]) {
    return Promise.resolve(status.redirect({ response, redirect: 503 }))
  }

  const url = normalize(request.url)
  const {
    [$configurationRequests]: configurationRequests,
    [$configurationEventEmitter]: emit
  } = configuration
  const { contexts } = configurationRequests
  const id = ++configurationRequests.lastId

  const emitParameters = {
    id,
    internal: !!request[$requestInternal],
    method: request.method.toUpperCase(),
    incomingUrl: request.url,
    url,
    headers: { ...request.headers },
    start: new Date(),
    perfStart: performance.now()
  }

  const [dispatching, dispatched] = defer()

  const context = {
    id,
    configuration,
    emit,
    emitParameters,
    holding: dispatching,
    redirectCount: 0,
    redirected: dispatched,
    request,
    response
  }

  request[$requestContext] = context

  request.on('aborted', onAborted)
  request.on('close', onClose)

  emit(EVENT_INCOMING, emitParameters)

  contexts.set(id, context)

  if (configurationRequests.holding) {
    configurationRequests.holding.then(() => dispatch(context, url))
  } else {
    dispatch(context, url)
  }

  return dispatching
}
