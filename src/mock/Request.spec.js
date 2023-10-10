'use strict'

const { assert } = require('test-tools')
const Request = require('./Request')

describe('mock/Request', () => {
  describe('constructor', () => {
    function check (request, { method, url, headers = {}, body = '' }) {
      assert(() => request.method === 'GET')
      assert(() => request.url === '/')
      assert(() => Object.keys(request.headers).length === Object.keys(headers).length)
      Object.keys(headers).forEach(header => {
        assert(() => request.headers[header] === headers[header])
      })
      assert(() => request._body === body)
    }

    describe('parameters', () => {
      it('supports method and url', () => {
        check(new Request('GET', '/'), {
          method: 'GET',
          url: '/'
        })
      })

      it('supports method, url and headers', () => {
        check(new Request('GET', '/', { 'x-info': 1 }), {
          method: 'GET',
          url: '/',
          headers: { 'x-info': 1 }
        })
      })

      it('supports method, url, headers and body', () => {
        check(new Request('GET', '/', { 'content-length': 12 }, 'Hello World!'), {
          method: 'GET',
          url: '/',
          headers: { 'content-length': 12 },
          body: 'Hello World!'
        })
      })

      it('supports method, url and body', () => {
        check(new Request('GET', '/', 'Hello World!'), {
          method: 'GET',
          url: '/',
          headers: {},
          body: 'Hello World!'
        })
      })

      it('supports method, url, headers, body and properties', () => {
        const request = new Request('GET', '/', { 'content-length': 12 }, 'Hello World!', { test: 1 })
        check(request, {
          method: 'GET',
          url: '/',
          headers: { 'content-length': 12 },
          body: 'Hello World!'
        })
        assert(() => request.test === 1)
      })

      it('supports method, url, body and properties', () => {
        const request = new Request('GET', '/', 'Hello World!', { test: 1 })
        check(request, {
          method: 'GET',
          url: '/',
          headers: {},
          body: 'Hello World!'
        })
        assert(() => request.test === 1)
      })
    })

    describe('object', () => {
      it('supports method, url, headers, body and properties', () => {
        const request = new Request({
          method: 'GET',
          url: '/',
          headers: { 'content-length': 12 },
          body: 'Hello World!',
          properties: {
            test: 1
          }
        })
        check(request, {
          method: 'GET',
          url: '/',
          headers: { 'content-length': 12 },
          body: 'Hello World!'
        })
        assert(() => request.test === 1)
      })
    })
  })

  it('simulates abort', () => {
    const request = new Request('GET', '/')
    let eventThrown
    request.on('aborted', () => {
      eventThrown = true
    })
    request.abort()
    assert(() => eventThrown)
    assert(() => request.aborted)
  })
})
