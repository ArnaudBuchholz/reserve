'use strict'

const Request = require('../../src/mock/Request')
const Response = require('../../src/mock/Response')
const IConfiguration = require('../../src/iconfiguration')
const { check } = require('../../src/mapping')
const { checkHandler } = require('../../src/configuration')
const { $handlerPrefix } = require('../../src/symbols')

const $checked = Symbol('mapping-already-checked')

module.exports = (handler, defaults = {}) => {
  checkHandler(handler, handler[$handlerPrefix])
  return function ({ request, mapping, configuration, match, redirect, response }) {
    if (typeof request === 'string') {
      request = { method: 'GET', url: request }
    }
    if (!(request instanceof Request)) {
      request = new Request(request)
    }
    if (!response) {
      response = new Response()
    }
    configuration = { ...defaults.configuration, ...configuration, handler: () => { return { handler } } }
    const iconfiguration = new IConfiguration(configuration)
    if (!match) {
      match = []
    }
    let mappingReady
    if (mapping !== null && (!mapping || !mapping[$checked])) {
      mapping = { ...defaults.mapping, ...mapping, [$checked]: true }
      mappingReady = check(configuration, mapping)
    } else {
      mappingReady = Promise.resolve()
    }
    return mappingReady
      .then(() => {
        const promise = handler.redirect({
          configuration: iconfiguration,
          match,
          request,
          response,
          mapping,
          redirect: redirect || request.url
        })
        return { mapping, promise, request, response }
      })
  }
}
