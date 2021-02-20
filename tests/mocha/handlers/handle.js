'use strict'

const Request = require('../../../mock/Request')
const Response = require('../../../mock/Response')
const IConfiguration = require('../../../iconfiguration')
const { check } = require('../../../mapping')

const $checked = Symbol('mapping-already-checked')

module.exports = (handler, defaults = {}) => function ({ request, mapping, configuration, match, redirect }) {
  if (typeof request === 'string') {
    request = { method: 'GET', url: request }
  }
  request = new Request(request)
  const response = new Response()
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
