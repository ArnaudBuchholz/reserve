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
      mapping: {},
      redirect: http.urls.empty
    })
    assert(() => typeof result.then === 'function')
  })

  it('pipes URL content', () => {
    const request = new Request('GET', 'http://example.com/abwhatever', {
      'x-status-code': 200,
      'x-value-1': 'test',
      'host': 'http://example.com'
    }, 'Hello World!')
    const response = new Response()
    return urlHandler.redirect({
      request,
      response,
      mapping: {},
      redirect: http.urls.echo
    })
      .then(value => {
        assert(() => value === undefined)
        assert(() => response.statusCode === 200)
        assert(() => response.headers['x-value-1'] === 'test')
        assert(() => response.headers['host'] === undefined)
        assert(() => response.toString() === 'Hello World!')
      })
  })

  it('pipes URL content (https)', () => {
    const request = new Request('GET', 'http://example.com/abwhatever', {
      'x-status-code': 200
    }, 'Hello World!')
    const response = new Response()
    return urlHandler.redirect({
      request,
      response,
      mapping: {},
      redirect: http.urls.echos
    })
      .then(value => {
        assert(() => value === undefined)
        assert(() => response.statusCode === 200)
        assert(() => response.toString() === 'Hello World!')
      })
  })

  it('unsecures cookies', () => {
    const request = new Request('GET', 'http://example.com/abwhatever', {
      'x-status-code': 200,
      'Set-Cookie': ['name=value; Secure']
    })
    const response = new Response()
    return urlHandler.redirect({
      request,
      response,
      mapping: {
        'unsecure-cookies': true
      },
      redirect: http.urls.echos
    })
      .then(value => {
        assert(() => value === undefined)
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Set-Cookie'] === 'name=value;')
      })
  })
})
