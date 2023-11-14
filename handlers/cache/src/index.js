'use strict'

const $cache = Symbol('REserve/cache@data')
const { body, send } = require('reserve')

const handlers = {}

handlers.GET = async ({ cache, redirect, response }) => {
  const value = cache[redirect]
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
  if (Object.prototype.hasOwnProperty.call(cache, redirect)) {
    statusCode = 200
  } else {
    statusCode = 201
  }
  cache[redirect] = await body(request)
  send(response, statusCode)
}

handlers.DELETE = async ({ cache, redirect, response }) => {
  delete cache[redirect]
  send(response, 204)
}

module.exports = {
  async validate (mapping) {
    mapping[$cache] = {}
  },
  method: Object.keys(handlers),
  async redirect ({ mapping, match, redirect, request, response }) {
    return handlers[request.method]({ cache: mapping[$cache], redirect, request, response })
  }
}