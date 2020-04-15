'use strict'

const http = require('../http')

const assert = require('../assert')
const Request = require('../../../mock/Request')
const Response = require('../../../mock/Response')
const urlHandler = require('../../../handlers/url')
const initMapping = require('./initMapping.js')(urlHandler)

describe('handlers/url', () => {
  it('returns a promise', async () => {
    const request = new Request()
    const response = new Response()
    const mapping = await initMapping({})
    const result = urlHandler.redirect({
      request,
      response,
      mapping,
      redirect: http.urls.empty
    })
    assert(() => typeof result.then === 'function')
  })

  it('pipes URL content', async () => {
    const request = new Request('GET', 'http://example.com/whatever', {
      'x-status-code': 200,
      'x-value-1': 'test',
      host: 'http://example.com'
    }, 'Hello World!')
    const response = new Response()
    const mapping = await initMapping({})
    const value = await urlHandler.redirect({
      request,
      response,
      mapping,
      redirect: http.urls.echo
    })
    assert(() => value === undefined)
    assert(() => response.statusCode === 200)
    assert(() => response.headers['x-value-1'] === 'test')
    assert(() => response.headers.host === undefined)
    assert(() => response.toString() === 'Hello World!')
  })

  it('pipes URL content (https)', async () => {
    const request = new Request('GET', 'http://example.com/whatever', {
      'x-status-code': 200
    }, 'Hello World!')
    const response = new Response()
    const mapping = await initMapping({})
    const value = await urlHandler.redirect({
      request,
      response,
      mapping,
      redirect: http.urls.echos
    })
    assert(() => value === undefined)
    assert(() => response.statusCode === 200)
    assert(() => response.toString() === 'Hello World!')
  })

  it('unsecures cookies', async () => {
    const request = new Request('GET', 'http://example.com/abwhatever', {
      'x-status-code': 200,
      'Set-Cookie': ['name=value; Secure;']
    })
    const response = new Response()
    const mapping = await initMapping({
      'unsecure-cookies': true
    })
    const value = await urlHandler.redirect({
      request,
      response,
      mapping,
      redirect: http.urls.echos
    })
    assert(() => value === undefined)
    assert(() => response.statusCode === 200)
    assert(() => response.headers['Set-Cookie'][0] === 'name=value;')
  })
})
