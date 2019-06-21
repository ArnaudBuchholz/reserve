'use strict'

require('../mocked_modules/http')
require('../mocked_modules/https')
const http = require('../http')

const assert = require('../assert')
const Request = require('../Request')
const Response = require('../Response')
const urlHandler = require('../../../handlers/url')

describe('handlers/url', () => {
  it('returns a promise', () => {
    const request = new Request()
    const response = new Response()
    const result = urlHandler.redirect({
      request,
      response,
      mapping: {
      },
      redirect: http.urls.empty
    })
    assert(() => typeof result.then === 'function')
  })
})
