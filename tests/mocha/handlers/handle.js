'use strict'

const Request = require('../../../mock/Request')
const Response = require('../../../mock/Response')
const { check } = require('../../../mapping')

module.exports = (handler, defaults = {}) => function test ({ request, mapping, configuration, match, redirect }) {
  if (typeof request === 'string') {
    request = { method: 'GET', url: request }
  }
  request = new Request(request)
  const response = new Response()
  configuration = { ...defaults.configuration, ...configuration, handler: () => { return { handler } } }
  let mappingReady
  if (mapping !== null) {
    mapping = { ...defaults.mapping, ...mapping }
    mappingReady = check(configuration, mapping)
  } else {
    mappingReady = Promise.resolve()
  }
  return mappingReady
    .then(() => {
      const promise = handler.redirect({
        configuration,
        match,
        request,
        response,
        mapping,
        redirect: redirect || request.url
      })
      return { promise, response }
    })
}
