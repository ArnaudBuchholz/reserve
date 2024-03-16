'use strict'

const Request = require('../../src/mock/Request')
const Response = require('../../src/mock/Response')
const IConfiguration = require('../../src/config/iconfiguration')
const checkMapping = require('../../src/config/checkMapping')
const { checkHandler } = require('../../src/config/configuration')
const { $handlerPrefix, $configurationInterface } = require('../../src/symbols')
const normalize = require('../../src/helpers/normalize')

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
    configuration = { ...defaults.configuration, ...configuration, handlers: { [handler[$handlerPrefix]]: handler } }
    const iconfiguration = new IConfiguration(configuration)
    configuration[$configurationInterface] = iconfiguration
    if (!match) {
      match = []
    }
    let mappingReady
    if (mapping !== null && (!mapping || !mapping[$checked])) {
      mapping = { [handler[$handlerPrefix]]: '', ...defaults.mapping, ...mapping, [$checked]: true }
      mappingReady = checkMapping(configuration, mapping)
    } else {
      mappingReady = Promise.resolve()
    }
    return mappingReady
      .then(() => {
        const redirected = handler.redirect({
          configuration: iconfiguration,
          match,
          request,
          response,
          mapping,
          redirect: redirect || normalize(request.url)
        })
        return { mapping, redirected, request, response }
      })
  }
}
