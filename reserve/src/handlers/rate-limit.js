'use strict'

const send = require('../helpers/send')
const {
  EVENT_RATE_LIMIT_EXCEEDED,
  EVENT_RATE_LIMIT_RESET,
  EVENT_RATE_LIMIT_WARNING
} = require('../event')
const { $handlerPrefix, $schema } = require('../symbols')

const supportedAlgorithms = ['fixed-window', 'token-bucket', 'sliding-window', 'concurrent-requests']
const stores = new WeakMap()

class MemoryStore {
  constructor () {
    this.records = new Map()
  }

  get (key) {
    return this.records.get(key)
  }

  set (key, value) {
    this.records.set(key, value)
    return value
  }

  delete (key) {
    return this.records.delete(key)
  }

  increment (key, value = 1) {
    const nextValue = (this.records.get(key) || 0) + value
    this.records.set(key, nextValue)
    return nextValue
  }

  decrement (key, value = 1) {
    const nextValue = Math.max(0, (this.records.get(key) || 0) - value)
    this.records.set(key, nextValue)
    return nextValue
  }
}

class RedisStore {
  constructor (client) {
    this.client = client
  }

  async get (key) {
    const value = await this.client.get(key)
    return value === null || value === undefined ? undefined : JSON.parse(value)
  }

  async set (key, value, ttlMs) {
    const payload = JSON.stringify(value)

    if (ttlMs && this.client.set) {
      await this.client.set(key, payload, 'PX', ttlMs)
    } else if (this.client.set) {
      await this.client.set(key, payload)
    }

    return value
  }

  async delete (key) {
    if (this.client.del) {
      return this.client.del(key)
    }
  }

  async increment (key, value = 1) {
    const nextValue = value === 1 && this.client.incr
      ? await this.client.incr(key)
      : (await this.get(key) || 0) + value
    await this.set(key, nextValue)
    return nextValue
  }

  async decrement (key, value = 1) {
    const nextValue = Math.max(0, (await this.get(key) || 0) - value)
    await this.set(key, nextValue)
    return nextValue
  }
}

function isPromise (value) {
  return value && typeof value.then === 'function'
}

function after (value, callback) {
  if (isPromise(value)) {
    return value.then(callback)
  }

  return callback(value)
}

function getStore (mapping, options) {
  if (options.store && typeof options.store === 'object' && options.store.type === 'custom') {
    return options.store.instance || options.store.implementation
  }

  if (options.store && typeof options.store === 'object' && options.store.type === 'redis') {
    if (!stores.has(options.store)) {
      stores.set(options.store, new RedisStore(options.store.client))
    }
    return stores.get(options.store)
  }

  let store = stores.get(mapping)

  if (!store) {
    store = new MemoryStore()
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

function getUrlParam (request, name) {
  const url = new URL(request.url || '/', 'http://localhost')
  return url.searchParams.get(name)
}

function getBodyParam (request, name) {
  const body = request.body || request._body

  if (!body) {
    return undefined
  }

  if (typeof body === 'object' && !Buffer.isBuffer(body)) {
    return body[name]
  }

  try {
    return JSON.parse(body.toString())[name]
  } catch (e) {
    return undefined
  }
}

function getSingleKey (request, keyOptions = { type: 'ip' }) {
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

  if (keyOptions.type === 'url' || keyOptions.type === 'query') {
    return getUrlParam(request, keyOptions.name) || 'unknown'
  }

  if (keyOptions.type === 'body') {
    return getBodyParam(request, keyOptions.name) || 'unknown'
  }

  if (keyOptions.type === 'session') {
    return (request.session && request.session.id) || request.sessionID || 'unknown'
  }

  return getIpKey(request)
}

function getKey (request, keyOptions = { type: 'ip' }) {
  if (Array.isArray(keyOptions)) {
    return keyOptions.map(options => getSingleKey(request, options)).join(':')
  }

  if (keyOptions.type === 'composite') {
    return (keyOptions.parts || []).map(options => getSingleKey(request, options)).join(':')
  }

  return getSingleKey(request, keyOptions)
}

function createDetails (options, key, state, reason, retryAfter) {
  return {
    key,
    algorithm: options.algorithm,
    reason,
    retryAfter,
    limit: options.limit || options.capacity || options.max,
    current: state && (state.count || state.currentCount || state.tokens || state.concurrent || state)
  }
}

function emitRateLimit (emit, event, details) {
  if (emit) {
    emit(event, {
      rateLimit: details
    })
  }
}

function block ({ response, options, retryAfter }) {
  if (options.onLimit !== undefined) {
    return options.onLimit
  }

  return send(response, options.message || 'Too Many Requests', {
    statusCode: 429,
    headers: Object.assign({
      'Retry-After': String(retryAfter)
    }, options.headers || {})
  })
}

function getFixedWindowState (store, key, now, windowMs) {
  const windowStart = Math.floor(now / windowMs) * windowMs

  return after(store.get(key), state => {
    if (!state || state.windowStart !== windowStart) {
      const newState = {
        windowStart,
        count: 0
      }
      return after(store.set(key, newState, windowMs), () => newState)
    }

    return state
  })
}

function applyFixedWindow ({ options, store, key, now, response, emit }) {
  return after(getFixedWindowState(store, key, now, options.windowMs), state => {
    if (state.count >= options.limit) {
      const retryAfter = Math.max(1, Math.ceil((state.windowStart + options.windowMs - now) / 1000))
      const details = createDetails(options, key, state, 'fixed-window-exhausted', retryAfter)
      emitRateLimit(emit, EVENT_RATE_LIMIT_EXCEEDED, details)
      return block({ response, options, retryAfter })
    }

    ++state.count
    emitWarning({ emit, options, key, state, current: state.count, limit: options.limit })
    return after(store.set(key, state, state.windowStart + options.windowMs - now), () => undefined)
  })
}

function getTokenBucketState (store, key, now, options) {
  return after(store.get(key), state => {
    if (!state) {
      const newState = {
        tokens: options.capacity,
        updatedAt: now
      }
      return after(store.set(key, newState, options.refillIntervalMs), () => newState)
    }

    const elapsed = now - state.updatedAt

    if (elapsed > 0) {
      state.tokens = Math.min(options.capacity, state.tokens + elapsed * options.refillRate / options.refillIntervalMs)
      state.updatedAt = now
    }

    return state
  })
}

function applyTokenBucket ({ options, store, key, now, response, emit }) {
  return after(getTokenBucketState(store, key, now, options), state => {
    if (state.tokens < 1) {
      const missingTokens = 1 - state.tokens
      const retryAfter = Math.max(1, Math.ceil(missingTokens * options.refillIntervalMs / options.refillRate / 1000))
      const details = createDetails(options, key, state, 'token-bucket-empty', retryAfter)
      emitRateLimit(emit, EVENT_RATE_LIMIT_EXCEEDED, details)
      return block({ response, options, retryAfter })
    }

    --state.tokens
    emitWarning({ emit, options, key, state, current: options.capacity - state.tokens, limit: options.capacity })
    return after(store.set(key, state, options.refillIntervalMs), () => undefined)
  })
}

function getSlidingWindowState (store, key, now, windowMs) {
  const windowStart = Math.floor(now / windowMs) * windowMs

  return after(store.get(key), state => {
    if (!state) {
      const newState = {
        currentWindowStart: windowStart,
        currentCount: 0,
        previousCount: 0
      }
      return after(store.set(key, newState, windowMs * 2), () => newState)
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
  })
}

function applySlidingWindow ({ options, store, key, now, response, emit }) {
  return after(getSlidingWindowState(store, key, now, options.windowMs), state => {
    const elapsed = now - state.currentWindowStart
    const weight = (options.windowMs - elapsed) / options.windowMs
    const weightedCount = state.previousCount * weight + state.currentCount

    if (weightedCount >= options.limit) {
      const retryAfter = Math.max(1, Math.ceil((options.windowMs - elapsed) / 1000))
      const details = createDetails(options, key, state, 'sliding-window-exhausted', retryAfter)
      emitRateLimit(emit, EVENT_RATE_LIMIT_EXCEEDED, details)
      return block({ response, options, retryAfter })
    }

    ++state.currentCount
    emitWarning({ emit, options, key, state, current: weightedCount + 1, limit: options.limit })
    return after(store.set(key, state, options.windowMs * 2), () => undefined)
  })
}

function onceFinished (response, callback) {
  let done = false
  const onDone = () => {
    if (!done) {
      done = true
      callback()
    }
  }
  response.on('finish', onDone)
  response.on('close', onDone)
}

function applyConcurrentRequests ({ options, store, key, response, emit }) {
  return after(store.increment(key), count => {
    if (count > options.max) {
      return after(store.decrement(key), () => {
        const retryAfter = Math.max(1, Math.ceil(options.retryAfterMs / 1000))
        const details = createDetails(options, key, count, 'concurrent-requests-exhausted', retryAfter)
        emitRateLimit(emit, EVENT_RATE_LIMIT_EXCEEDED, details)
        return block({ response, options, retryAfter })
      })
    }

    emitWarning({ emit, options, key, state: count, current: count, limit: options.max })
    onceFinished(response, () => {
      const decremented = store.decrement(key)
      after(decremented, current => {
        if (current === 0) {
          emitRateLimit(emit, EVENT_RATE_LIMIT_RESET, createDetails(options, key, current, 'concurrent-requests-reset', 0))
        }
      })
    })
  })
}

function emitWarning ({ emit, options, key, state, current, limit }) {
  if (!options.warningThreshold) {
    return
  }

  if (current / limit >= options.warningThreshold) {
    emitRateLimit(emit, EVENT_RATE_LIMIT_WARNING, createDetails(options, key, state, 'threshold-reached', 0))
  }
}

const algorithms = {
  'fixed-window': applyFixedWindow,
  'token-bucket': applyTokenBucket,
  'sliding-window': applySlidingWindow,
  'concurrent-requests': applyConcurrentRequests
}

function applyDefaults (options) {
  if (options.algorithm === undefined) {
    options.algorithm = 'fixed-window'
  }

  if (!supportedAlgorithms.includes(options.algorithm)) {
    throw new Error(`Unsupported rate-limit algorithm: ${options.algorithm}`)
  }

  if (options.algorithm === 'fixed-window' || options.algorithm === 'sliding-window') {
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

  if (options.algorithm === 'concurrent-requests') {
    if (options.max === undefined) {
      options.max = 10
    }

    if (options.retryAfterMs === undefined) {
      options.retryAfterMs = 1000
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
}

function validateStore (options) {
  if (options.store === undefined) {
    return
  }

  if (options.store === 'memory') {
    return
  }

  if (options.store && options.store.type === 'redis') {
    if (!options.store.client || typeof options.store.client.get !== 'function') {
      throw new Error('Redis rate-limit store requires a client with get/set methods')
    }
    return
  }

  if (options.store && options.store.type === 'custom') {
    const store = options.store.instance || options.store.implementation
    if (!store || typeof store.get !== 'function' || typeof store.set !== 'function') {
      throw new Error('Custom rate-limit store requires get and set methods')
    }
    return
  }

  throw new Error('Unsupported rate-limit store')
}

module.exports = {
  [$handlerPrefix]: 'rate-limit',

  [$schema]: {
    'rate-limit': ['boolean', 'object']
  },

  MemoryStore,
  RedisStore,

  validate (mapping) {
    let options = mapping['rate-limit']

    if (options === false || options === undefined) {
      return
    }

    if (options === true) {
      options = {}
      mapping['rate-limit'] = options
    }

    applyDefaults(options)
    validateStore(options)
  },

  redirect ({ mapping, request, response, emit }) {
    const options = mapping['rate-limit']

    if (!options) {
      return
    }

    const key = getKey(request, options.key)

    if (options.whitelist.includes(key)) {
      return
    }

    if (options.blacklist.includes(key)) {
      const details = createDetails(options, key, null, 'blacklisted', 1)
      emitRateLimit(emit, EVENT_RATE_LIMIT_EXCEEDED, details)
      return block({ response, options, retryAfter: 1 })
    }

    return algorithms[options.algorithm]({
      options,
      store: getStore(mapping, options),
      key,
      now: Date.now(),
      response,
      emit
    })
  }
}
