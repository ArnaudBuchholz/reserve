'use strict'

const $cache = Symbol('REserve/cache@data')
const { body, cache, send } = require('reserve')

const handlers = {}

handlers.GET = async ({ cache, redirect, response }) => {
  const value = cache.get(redirect)
  if (value === undefined) {
    send(response, undefined, {
      statusCode: 204
    })
  } else {
    send(response, value)
  }
}

handlers.POST = async ({ cache, redirect, request, response }) => {
  let statusCode
  if (cache.keys().include(redirect)) {
    statusCode = 200
  } else {
    statusCode = 201
  }
  cache.set(redirect, await body(request))
  send(response, undefined, { statusCode })
}

handlers.DELETE = async ({ cache, redirect, response }) => {
  cache.del(redirect)
  send(response, undefined, { statusCode: 204 })
}

module.exports = {
  schema: {
    ttl: {
      type: 'number',
      defaultValue: 0
    },
    max: {
      type: 'number',
      default: 0
    },
    policy: {
      type: 'string',
      default: 'lru'
    }
  },
  async validate (mapping) {
    mapping[$cache] = cache({
      ttl: mapping.ttl || undefined,
      max: mapping.max || undefined,
      policy: mapping.policy
    })
  },
  method: Object.keys(handlers),
  async redirect ({ mapping, match, redirect, request, response }) {
    return handlers[request.method]({ cache: mapping[$cache], redirect, request, response })
  }
}
