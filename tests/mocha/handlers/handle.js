'use strict'

const Request = require('../../../mock/Request')
const Response = require('../../../mock/Response')

module.exports = (handler, defaults = {}) => function test ({ request, mapping, configuration, match, redirect } = {}) {
  if (typeof request === 'string') {
    request = { method: 'GET', url: request }
  }
  request = new Request(request)
  const response = new Response()
  mapping = { ...defaults.mapping, ...mapping }
  let mappingReady
  if (handler.validate) {
    mappingReady = handler.validate(mapping)
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
