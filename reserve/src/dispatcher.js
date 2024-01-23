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
} = require('./EventEmitter')
const {
  $configurationInterface,
  $configurationRequests,
  $mappingMatch,
  $requestId,
  $requestInternal,
  $handlerPrefix,
  $configurationEventEmitter
} = require('./symbols')

function emitError (context, reason) {
  const handled = context.emit(EVENT_ERROR, context.emitParameters, { reason })
  if (!handled) {
    logError({ ...context.emitParameters, reason }) // Unhandled error
  }
}

function redirected (context) {
  const perfEnd = performance.now()
  context.emit(EVENT_REDIRECTED, context.emitParameters, {
    end: new Date(),
    perfEnd,
    timeSpent: Math.ceil(perfEnd - context.emitParameters.perfStart),
    statusCode: context.response.statusCode
  })
  context.redirected()
}

function error (context, reason) {
  let statusCode
  if (typeof reason === 'number') {
    statusCode = reason
  } else {
    statusCode = 500
  }
  emitError(context, reason)
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
  const redirectCount = ++context.redirectCount
  if (redirectCount > context.configuration['max-redirect']) {
    error(context, 508)
  } else {
    dispatch(context, url)
  }
}

function redirecting (context, { mapping = {}, match, handler, type, redirect, url, index = 0 }) {
  try {
    const prefix = handler[$handlerPrefix] || 'external'
    const start = performance.now()
    context.emit(EVENT_REDIRECTING, context.emitParameters, { type, redirect })
    if (mapping['exclude-from-holding-list']) {
      context.nonHolding = true
      context.holding = Promise.resolve()
    }
    const result = handler.redirect({
      configuration: context.configuration[$configurationInterface],
      mapping,
      match,
      redirect,
      request: context.request,
      response: context.response
    })
    const afterRedirect = (result) => {
      const end = performance.now()
      context.emitParameters.perfHandlers.push({
        prefix,
        start,
        end
      })
      if (result !== undefined) {
        redispatch(context, result)
      } else if (context.ended) {
        redirected(context)
      } else {
        dispatch(context, url, index + 1)
      }
    }
    if (result && result.then) {
      result.then(afterRedirect)
    } else {
      afterRedirect(result)
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

function hookedEnd (context, ...args) {
  const {
    configuration,
    id,
    nativeEnd
  } = context
  context.ended = true
  const { contexts } = configuration[$configurationRequests]
  delete contexts[id]
  return nativeEnd.apply(this, args)
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
    perfStart: performance.now(),
    perfHandlers: []
  }

  let dispatched
  const dispatching = new Promise(resolve => { dispatched = resolve })

  const context = {
    configuration,
    emit,
    emitParameters,
    holding: dispatching,
    nativeEnd: response.end,
    ended: false,
    redirectCount: 0,
    redirected: dispatched,
    request,
    response
  }

  response.end = hookedEnd.bind(response, context)
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
