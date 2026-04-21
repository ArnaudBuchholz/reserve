'use strict'

const send = require('../helpers/send')
const { $handlerPrefix, $schema } = require('../symbols')

const supportedAlgorithms = ['fixed-window', 'token-bucket', 'sliding-window']
const stores = new WeakMap()

function getStore (mapping) {
  let store = stores.get(mapping)

  if (!store) {
    store = new Map()
    stores.set(mapping, store)
  }

  return store
}

function getHeaderValue (headers = {}, name) {
  const lowerName = name.toLowerCase()

  if (headers[name] !== undefined) {
    return headers[name]
  }

  if (headers[lowerName] !== undefined) {
    return headers[lowerName]
  }

  const matchingName = Object.keys(headers).find(headerName => headerName.toLowerCase() === lowerName)

  if (matchingName !== undefined) {
    return headers[matchingName]
  }

  return undefined
}

function normalizeForwardedValue (value) {
  if (typeof value !== 'string') {
    return value
  }

  return value.split(',')[0].trim()
}

function getIpKey (request) {
  const forwardedFor = getHeaderValue(request.headers, 'x-forwarded-for')

  if (forwardedFor) {
    return normalizeForwardedValue(forwardedFor)
  }

  if (request.socket && request.socket.remoteAddress) {
    return request.socket.remoteAddress
  }

  return 'unknown'
}

function getKey (request, keyOptions = { type: 'ip' }) {
  if (keyOptions.type === 'header') {
    if (!keyOptions.name) {
      return getIpKey(request)
    }

    const headerValue = getHeaderValue(request.headers, keyOptions.name)

    if (headerValue !== undefined && headerValue !== '') {
      return normalizeForwardedValue(headerValue)
    }

    return 'unknown'
  }

  return getIpKey(request)
}

function block (response, retryAfter) {
  return send(response, 'Too Many Requests', {
    statusCode: 429,
    headers: {
      'Retry-After': String(retryAfter)
    }
  })
}

function getFixedWindowState (store, key, now, windowMs) {
  const windowStart = Math.floor(now / windowMs) * windowMs
  const state = store.get(key)

  if (!state || state.windowStart !== windowStart) {
    const newState = {
      windowStart,
      count: 0
    }
    store.set(key, newState)
    return newState
  }

  return state
}

function applyFixedWindow ({ options, store, key, now, response }) {
  const state = getFixedWindowState(store, key, now, options.windowMs)

  if (state.count >= options.limit) {
    const retryAfter = Math.max(1, Math.ceil((state.windowStart + options.windowMs - now) / 1000))
    return block(response, retryAfter)
  }

  ++state.count
}

function getTokenBucketState (store, key, now, options) {
  const state = store.get(key)

  if (!state) {
    const newState = {
      tokens: options.capacity,
      updatedAt: now
    }
    store.set(key, newState)
    return newState
  }

  const elapsed = now - state.updatedAt

  if (elapsed > 0) {
    const refill = elapsed * options.refillRate / options.refillIntervalMs
    state.tokens = Math.min(options.capacity, state.tokens + refill)
    state.updatedAt = now
  }

  return state
}

function applyTokenBucket ({ options, store, key, now, response }) {
  const state = getTokenBucketState(store, key, now, options)

  if (state.tokens < 1) {
    const missingTokens = 1 - state.tokens
    const retryAfter = Math.max(1, Math.ceil(missingTokens * options.refillIntervalMs / options.refillRate / 1000))
    return block(response, retryAfter)
  }

  --state.tokens
}

function getSlidingWindowState (store, key, now, windowMs) {
  const windowStart = Math.floor(now / windowMs) * windowMs
  const state = store.get(key)

  if (!state) {
    const newState = {
      currentWindowStart: windowStart,
      currentCount: 0,
      previousCount: 0
    }
    store.set(key, newState)
    return newState
  }

  if (state.currentWindowStart !== windowStart) {
    if (state.currentWindowStart === windowStart - windowMs) {
      state.previousCount = state.currentCount
    } else {
      state.previousCount = 0
    }

    state.currentWindowStart = windowStart
    state.currentCount = 0
  }

  return state
}

function applySlidingWindow ({ options, store, key, now, response }) {
  const state = getSlidingWindowState(store, key, now, options.windowMs)
  const elapsed = now - state.currentWindowStart
  const weight = (options.windowMs - elapsed) / options.windowMs
  const weightedCount = state.previousCount * weight + state.currentCount

  if (weightedCount >= options.limit) {
    const retryAfter = Math.max(1, Math.ceil((options.windowMs - elapsed) / 1000))
    return block(response, retryAfter)
  }

  ++state.currentCount
}

const algorithms = {
  'fixed-window': applyFixedWindow,
  'token-bucket': applyTokenBucket,
  'sliding-window': applySlidingWindow
}

module.exports = {
  [$handlerPrefix]: 'rate-limit',

  [$schema]: {
    'rate-limit': ['boolean', 'object']
  },

  validate (mapping) {
    let options = mapping['rate-limit']

    if (options === false || options === undefined) {
      return
    }

    if (options === true) {
      options = {}
      mapping['rate-limit'] = options
    }

    if (options.algorithm === undefined) {
      options.algorithm = 'fixed-window'
    }

    if (!supportedAlgorithms.includes(options.algorithm)) {
      throw new Error(`Unsupported rate-limit algorithm: ${options.algorithm}`)
    }

    if (options.algorithm === 'fixed-window') {
      if (options.limit === undefined) {
        options.limit = 10
      }

      if (options.windowMs === undefined) {
        options.windowMs = 60000
      }
    }

    if (options.algorithm === 'sliding-window') {
      if (options.limit === undefined) {
        options.limit = 10
      }

      if (options.windowMs === undefined) {
        options.windowMs = 60000
      }
    }

    if (options.algorithm === 'token-bucket') {
      if (options.capacity === undefined) {
        options.capacity = 10
      }

      if (options.refillRate === undefined) {
        options.refillRate = 10
      }

      if (options.refillIntervalMs === undefined) {
        options.refillIntervalMs = 60000
      }
    }

    if (options.key === undefined) {
      options.key = { type: 'ip' }
    }

    if (options.whitelist === undefined) {
      options.whitelist = []
    }

    if (options.blacklist === undefined) {
      options.blacklist = []
    }
  },

  redirect ({ mapping, request, response }) {
    const options = mapping['rate-limit']

    if (!options) {
      return
    }

    const key = getKey(request, options.key)

    if (options.whitelist.includes(key)) {
      return
    }

    if (options.blacklist.includes(key)) {
      return block(response, 1)
    }

    return algorithms[options.algorithm]({
      options,
      store: getStore(mapping),
      key,
      now: Date.now(),
      response
    })
  }
}
