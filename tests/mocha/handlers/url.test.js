'use strict'

const mockRequire = require('mock-require')
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

  it('manipulates request details (forward-request)', async () => {
    const request = new Request('GET', 'http://example.com/abwhatever', {
      'x-status-code': 200,
      Cookie: 'name=value;'
    })
    const response = new Response()
    const configuration = {}
    const match = {}
    const mapping = await initMapping({
      'forward-request': async ({ configuration: receivedConfiguration, context, mapping: receivedMapping, match: receivedMatch, request }) => {
        assert(() => receivedConfiguration === configuration)
        assert(() => receivedMapping === mapping)
        assert(() => receivedMatch === match)
        assert(() => context && typeof context === 'object')
        assert(() => request.method === 'GET')
        assert(() => request.url === http.urls.echos)
        assert(() => request.headers['x-status-code'] === 200)
        assert(() => request.headers.Cookie === 'name=value;')
        request.headers.Cookie = 'a=b;c=d;'
      }
    })
    const value = await urlHandler.redirect({
      configuration,
      match,
      request,
      response,
      mapping,
      redirect: http.urls.echos
    })
    assert(() => value === undefined)
    assert(() => response.statusCode === 200)
    assert(() => response.headers.Cookie === 'a=b;c=d;')
  })

  it('manipulates response headers (forward-response)', async () => {
    const request = new Request('GET', 'http://example.com/abwhatever', {
      'x-status-code': 200,
      Cookie: 'name=value;'
    })
    const response = new Response()
    const configuration = {}
    const match = {}
    mockRequire('/url.forward-response.js', ({ configuration: receivedConfiguration, context, mapping: receivedMapping, match: receivedMatch, headers }) => {
      assert(() => receivedConfiguration === configuration)
      assert(() => receivedMapping === mapping)
      assert(() => receivedMatch === match)
      assert(() => context && typeof context === 'object')
      assert(() => headers['x-status-code'] === 200)
      assert(() => headers.Cookie === 'name=value;')
      headers.Cookie = 'a=b;c=d;'
    })
    const mapping = await initMapping({
      'forward-response': '/url.forward-response.js'
    })
    const value = await urlHandler.redirect({
      configuration,
      match,
      request,
      response,
      mapping,
      redirect: http.urls.echos
    })
    assert(() => value === undefined)
    assert(() => response.statusCode === 200)
    assert(() => response.headers.Cookie === 'a=b;c=d;')
  })

  it('provides a unique context to link forward-request and forward-response', async () => {
    const request1 = new Request('GET', 'http://example.com/abwhatever', {
      'x-status-code': 200,
      'x-id': 1
    })
    const response1 = new Response()
    const request2 = new Request('GET', 'http://example.com/abwhatever', {
      'x-status-code': 200,
      'x-id': 2
    })
    const response2 = new Response()
    let contextId = 0
    const checks = {}
    const mapping = await initMapping({
      'forward-request': ({ context, request }) => {
        assert(() => context.id === undefined)
        context.id = ++contextId
        context.requestId = request.headers['x-id']
        assert(() => context.requestId)
        assert(() => checks[context.id] === undefined)
        checks[context.id] = context.requestId
      },
      'forward-response': ({ context }) => {
        assert(() => context.id !== undefined)
        assert(() => context.requestId !== undefined)
        assert(() => checks[context.id] === context.requestId)
      }
    })
    return Promise.all([
      urlHandler.redirect({
        request: request1,
        response: response1,
        mapping,
        redirect: http.urls.echos
      }),
      urlHandler.redirect({
        request: request2,
        response: response2,
        mapping,
        redirect: http.urls.echos
      })
    ])
  })
})
