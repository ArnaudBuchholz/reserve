'use strict'

const { describe, it } = require('mocha')
const assert = require('assert')
const { check, Request, Response } = require('./index')
const dispatcher = require('./dispatcher')
const { $configurationEventEmitter } = require('./symbols')
const { newEventEmitter } = require('./event')

const textMimeType = 'text/plain'
const defaultConfigurationPromise = check({
  handlers: {
    fail: {
      redirect: function fail () {
        throw new Error('FAIL')
      }
    }
  },
  mappings: [{
    method: 'GET,INFO,POST',
    'invert-match': true,
    status: 405
  }, {
    method: 'INFO',
    custom: async function redirect () {
      return 405
    }
  }, {
    match: /^\/redirect/,
    custom: async function redirect () {
      return '/file.txt'
    }
  }, {
    match: /^\/404/,
    custom: async function err404 () {
      return 404
    }
  }, {
    match: /^\/fail/,
    fail: true
  }, {
    match: /^\/throw/,
    custom: function throw_ () {
      throw new Error()
    }
  }, {
    match: /^\/reject/,
    custom: function reject () {
      return Promise.reject(new Error())
    }
  }, {
    match: /^(.*)$/,
    custom: async function setXFlag (request, response) {
      response.setHeader('x-flag', 'true')
    }
  }, {
    match: /^\/file\.txt/,
    'invert-match': true,
    custom: async function setXNotFile (request, response) {
      response.setHeader('x-not-file', 'true')
    }
  }, {
    method: 'GET',
    match: '/if-match.txt',
    'if-match': function (request, url, match) {
      request.ifMatched = true
      if (request.headers['x-prevent-match']) {
        return false
      }
      if (request.headers['x-error']) {
        throw new Error(request.headers['x-error'])
      }
      const redirect = request.headers['x-match-redirect']
      const redirectAsNumber = parseInt(redirect, 10)
      if (redirectAsNumber > 0) {
        return redirectAsNumber
      }
      if (redirect) {
        return redirect
      }
      return true
    },
    custom: async function IfMatch (request, response) {
      response.writeHead(200, { 'Content-Type': textMimeType })
      response.end('if-match')
    }
  }, {
    cwd: '/',
    match: /^\/subst\/(.*)\/(.*)/,
    file: '/$1.$2'
  }, {
    cwd: '/',
    match: /^\/subst-complex\/(.*)\/(.*)/,
    file: '/$1$$1.$2$3'
  }, {
    cwd: '/',
    match: /^\/file\.txt/,
    file: '/file.txt'
  }]
})

function hasError (emitted) {
  return emitted.some(({ eventName }) => eventName === 'error')
}

function absorbError () {}

async function dispatch ({ configurationPromise, events, request, beforeWait }) {
  if (typeof request === 'string') {
    request = { method: 'GET', url: request }
  }
  if (!(request instanceof Request)) {
    request = new Request(request)
  }
  if (!configurationPromise) {
    configurationPromise = defaultConfigurationPromise
  }
  const configuration = await configurationPromise
  const response = new Response()
  const { on, emit } = newEventEmitter()
  configuration[$configurationEventEmitter] = emit
  const emitted = []
  on('*', event => emitted.push(event))
  if (events) {
    Object.keys(events).forEach(eventName => on(eventName, events[eventName]))
  } else {
    on('error', absorbError)
  }
  const promise = dispatcher(configuration, request, response)
  if (beforeWait) {
    beforeWait(request)
  }
  await promise
  return {
    emitted,
    request,
    response
  }
}

describe('dispatcher', () => {
  describe('events', () => {
    let firstRequestId

    it('provides request information on incoming and redirecting', () => dispatch({ request: '/redirect' })
      .then(({ emitted, promise, response }) => {
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers['Content-Type'], textMimeType)
        assert.strictEqual(response.toString(), 'Hello World!')
        const [incoming, redirecting] = emitted
        assert.strictEqual(incoming.eventName, 'incoming')
        assert.strictEqual(incoming.method, 'GET')
        assert.strictEqual(incoming.url, '/redirect')
        assert.strictEqual(typeof incoming.id, 'number')
        assert.ok(incoming.start instanceof Date)
        firstRequestId = incoming.id
        assert.strictEqual(redirecting.eventName, 'redirecting')
        assert.strictEqual(redirecting.id, firstRequestId)
      })
    )

    it('detects request closing', () => dispatch({
      request: {
        method: 'GET',
        url: '/redirect'
      },
      beforeWait: request => request.emit('close')
    })
      .then(({ emitted, response }) => {
        const [incoming] = emitted
        assert.strictEqual(incoming.eventName, 'incoming')
        assert.strictEqual(incoming.method, 'GET')
        assert.strictEqual(incoming.url, '/redirect')
        assert.strictEqual(typeof incoming.id, 'number')
        assert.ok(incoming.id !== firstRequestId)
        assert.ok(incoming.start instanceof Date)
        const [closed] = emitted.filter(({ eventName }) => eventName === 'closed')
        assert.strictEqual(closed.id, incoming.id)
      })
    )

    it('detects request aborting', () => dispatch({
      request: {
        method: 'GET',
        url: '/redirect'
      },
      beforeWait: request => request.abort()
    })
      .then(({ emitted, response }) => {
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers['Content-Type'], textMimeType)
        assert.strictEqual(response.toString(), '')
        const [incoming] = emitted
        assert.strictEqual(incoming.eventName, 'incoming')
        assert.strictEqual(incoming.method, 'GET')
        assert.strictEqual(incoming.url, '/redirect')
        assert.strictEqual(typeof incoming.id, 'number')
        assert.ok(incoming.id !== firstRequestId)
        assert.ok(incoming.start instanceof Date)
        const [aborted] = emitted.filter(({ eventName }) => eventName === 'aborted')
        assert.strictEqual(aborted.id, incoming.id)
      })
    )
  })

  describe('redirection', () => {
    it('supports internal redirection', () => dispatch({ request: '/redirect' })
      .then(({ emitted, response }) => {
        assert.ok(!hasError(emitted))
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers['Content-Type'], textMimeType)
        assert.strictEqual(response.toString(), 'Hello World!')
      })
    )

    it('supports internal status code', () => dispatch({ request: '/404' })
      .then(({ emitted, response }) => {
        assert.ok(!hasError(emitted))
        assert.strictEqual(response.statusCode, 404)
      })
    )
  })

  describe('regexp matching', () => {
    it('supports capturing groups substitution', () => dispatch({ request: '/subst/file/txt' })
      .then(({ emitted, response }) => {
        assert.ok(!hasError(emitted))
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers['Content-Type'], textMimeType)
        assert.strictEqual(response.toString(), 'Hello World!')
      })
    )

    it('supports capturing groups substitution (complex)', () => dispatch({ request: '/subst-complex/file/txt' })
      .then(({ emitted, response }) => {
        assert.ok(!hasError(emitted))
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers['Content-Type'], textMimeType)
        assert.strictEqual(response.toString(), '$1')
      })
    )
  })

  describe('method matching', () => {
    it('matches the mapping method', () => dispatch({ request: { method: 'INFO', url: '/file.txt' } })
      .then(({ emitted, response }) => {
        assert.ok(!hasError(emitted))
        assert.strictEqual(response.statusCode, 405)
      })
    )

    it('matches the handler method (no matching)', () => dispatch({ request: { method: 'POST', url: '/file.txt' } })
      .then(({ emitted, response }) => {
        assert.ok(hasError(emitted))
        assert.strictEqual(response.statusCode, 501)
      })
    )
  })

  describe('invert-match', () => {
    it('protects against unwanted verbs', () => dispatch({ request: { method: 'PUT', url: '/file.txt' } })
      .then(({ emitted, response }) => {
        assert.ok(!hasError(emitted))
        assert.strictEqual(response.statusCode, 405)
      })
    )

    it('enables all but matching', () => dispatch({ request: { method: 'GET', url: '/file2.txt' } })
      .then(({ response }) => {
        assert.strictEqual(response.headers['x-not-file'], 'true')
        assert.strictEqual(response.statusCode, 501)
      })
    )

    it('enables all but matching (not matching)', () => dispatch({ request: { method: 'GET', url: '/file.txt' } })
      .then(({ response }) => {
        assert.strictEqual(response.headers['x-not-file'], undefined)
        assert.strictEqual(response.statusCode, 200)
      })
    )
  })

  describe('if-match', () => {
    it('is not triggered if the mapping does not match', () => dispatch({ request: '/if-not-match.txt' })
      .then(({ emitted, request, response }) => {
        assert.ok(hasError(emitted))
        assert.ok(!request.ifMatched)
        assert.strictEqual(response.statusCode, 501)
      })
    )

    it('decides of the final match (prevent)', () => dispatch({ request: { method: 'GET', url: '/if-match.txt', headers: { 'x-prevent-match': true } } })
      .then(({ emitted, request, response }) => {
        assert.ok(hasError(emitted))
        assert.ok(request.ifMatched)
        assert.strictEqual(response.statusCode, 501)
      })
    )

    it('decides of the final match (allow)', () => dispatch({ request: { method: 'GET', url: '/if-match.txt' } })
      .then(({ emitted, request, response }) => {
        assert.ok(!hasError(emitted))
        assert.ok(request.ifMatched)
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.toString(), 'if-match')
      })
    )

    it('handles errors', () => dispatch({ request: { method: 'GET', url: '/if-match.txt', headers: { 'x-error': 'KO' } } })
      .then(({ emitted, request, response }) => {
        assert.ok(hasError(emitted))
        assert.ok(request.ifMatched)
        assert.strictEqual(response.statusCode, 500)
      })
    )

    it('enables redirect (number)', () => dispatch({ request: { method: 'GET', url: '/if-match.txt', headers: { 'x-match-redirect': '508' } } })
      .then(({ emitted, request, response }) => {
        assert.ok(!hasError(emitted))
        assert.ok(request.ifMatched)
        assert.strictEqual(response.statusCode, 508)
      })
    )

    it('enables redirect (string)', () => dispatch({ request: { method: 'GET', url: '/if-match.txt', headers: { 'x-match-redirect': '/file.txt' } } })
      .then(({ emitted, request, response }) => {
        assert.ok(!hasError(emitted))
        assert.ok(request.ifMatched)
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers['Content-Type'], textMimeType)
        assert.strictEqual(response.toString(), 'Hello World!')
      })
    )
  })

  describe('handlers', () => {
    it('redirects a request to the right handler', () => dispatch({ request: '/file.txt' })
      .then(({ emitted, response }) => {
        assert.ok(!hasError(emitted))
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers['Content-Type'], textMimeType)
        assert.strictEqual(response.toString(), 'Hello World!')
      })
    )

    it('allows handlers that don\'t finalize response', () => dispatch({ request: '/file.txt' })
      .then(({ emitted, response }) => {
        assert.ok(!hasError(emitted))
        assert.strictEqual(response.headers['x-flag'], 'true')
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers['Content-Type'], textMimeType)
        assert.strictEqual(response.toString(), 'Hello World!')
      })
    )
  })

  describe('Error handling', () => {
    describe('Internal errors', () => {
      it('supports internal handler error', () => dispatch({ request: '/fail' })
        .then(({ emitted, response }) => {
          assert.ok(hasError(emitted))
          assert.strictEqual(response.statusCode, 500)
        })
      )

      it('supports internal custom error', () => dispatch({ request: '/throw' })
        .then(({ emitted, response }) => {
          assert.ok(hasError(emitted))
          assert.strictEqual(response.statusCode, 500)
        })
      )

      it('supports internal promise rejection', () => dispatch({ request: '/reject' })
        .then(({ emitted, response }) => {
          assert.ok(hasError(emitted))
          assert.strictEqual(response.statusCode, 500)
        })
      )
    })

    describe('No handler for the request', () => {
      it('fails with error 501', () => dispatch({ request: '/unhandled' })
        .then(({ emitted, response }) => {
          assert.ok(hasError(emitted))
          assert.strictEqual(response.statusCode, 501)
        })
      )

      it('logs error 501', () => dispatch({ request: '/unhandled' })
        .then(({ emitted }) => {
          assert.ok(hasError(emitted))
          const error = emitted.filter(({ eventName }) => eventName === 'error')[0]
          assert.strictEqual(error.method, 'GET')
          assert.strictEqual(error.url, '/unhandled')
          assert.strictEqual(typeof error.id, 'number')
          assert.strictEqual(error.reason, 501)
        })
      )
    })

    describe('Infinite loop', () => {
      const loopConfigurationPromise = check({
        mappings: [{
          match: 'a',
          custom: async () => 'b'
        }, {
          match: 'b',
          custom: async () => 'a'
        }, {
          match: 'error',
          custom: async (request, response) => {
            response.writeHead = () => {
              throw new Error('Simulates exception during writeHead')
            }
            throw new Error('Simulates exception during redirect')
          }
        }]
      })

      it('prevents infinite redirection', () => dispatch({ configurationPromise: loopConfigurationPromise, request: 'a' })
        .then(({ emitted, response }) => {
          assert.ok(hasError(emitted))
          assert.strictEqual(response.statusCode, 508)
        })
      )

      it('prevents infinite loops in error handling', () => dispatch({ configurationPromise: loopConfigurationPromise, request: 'error' })
        .then(({ emitted, response }) => {
          assert.ok(hasError(emitted))
          assert.ok(response.writableEnded)
        })
      )
    })

    describe('listeners', () => {
      it('does not fail the request if the \'incoming\' listener fails', () => dispatch({
        request: '/file.txt',
        events: {
          error: absorbError,
          incoming: () => { throw new Error('FAIL') }
        }
      })
        .then(({ emitted, response }) => {
          assert.ok(!hasError(emitted))
          assert.ok(response.writableEnded)
          assert.strictEqual(response.statusCode, 200)
          assert.strictEqual(response.headers['Content-Type'], textMimeType)
          assert.strictEqual(response.toString(), 'Hello World!')
        })
      )

      it('does not fail the request if the \'redirecting\' listener fails', () => dispatch({
        request: '/file.txt',
        events: {
          error: absorbError,
          redirecting: () => { throw new Error('FAIL') }
        }
      })
        .then(({ emitted, response }) => {
          assert.ok(!hasError(emitted))
          assert.ok(response.writableEnded)
          assert.strictEqual(response.statusCode, 200)
          assert.strictEqual(response.headers['Content-Type'], textMimeType)
          assert.strictEqual(response.toString(), 'Hello World!')
        })
      )

      it('does not fail the request if the \'error\' listener fails', () => dispatch({
        request: '/fail',
        events: {
          error: () => { throw new Error('FAIL') }
        }
      })
        .then(({ response }) => {
          assert.strictEqual(response.statusCode, 500)
        })
      )

      it('does not fail the request if the \'redirected\' listener fails', () => dispatch({
        request: '/file.txt',
        events: {
          error: absorbError,
          redirected: () => { throw new Error('FAIL') }
        }
      })
        .then(({ emitted, response }) => {
          assert.ok(!hasError(emitted))
          assert.strictEqual(response.statusCode, 200)
          assert.strictEqual(response.headers['Content-Type'], textMimeType)
          assert.strictEqual(response.toString(), 'Hello World!')
        })
      )
    })
  })

  describe('URL normalization for security', () => {
    it('avoids path traversal by normalizing the URL if needed (using root ../)', () => {
      const request = new Request('GET')
      request.setForgedUrl('/../file.txt')
      return dispatch({ request })
        .then(({ emitted, response }) => {
          assert.ok(!hasError(emitted))
          assert.strictEqual(response.statusCode, 200)
          assert.strictEqual(response.headers['Content-Type'], textMimeType)
          assert.strictEqual(response.toString(), 'Hello World!')
        })
    })

    it('avoids path traversal by normalizing the URL if needed (using intermediate ../)', () => {
      const request = new Request('GET')
      request.setForgedUrl('/test/../file.txt')
      return dispatch({ request })
        .then(({ emitted, response }) => {
          assert.ok(!hasError(emitted))
          assert.strictEqual(response.statusCode, 200)
          assert.strictEqual(response.headers['Content-Type'], textMimeType)
          assert.strictEqual(response.toString(), 'Hello World!')
        })
    })

    it('avoids path traversal by normalizing the URL if needed (using root %2E%2E/)', () => {
      const request = new Request('GET')
      request.setForgedUrl('/%2E%2E/file.txt')
      return dispatch({ request })
        .then(({ emitted, response }) => {
          assert.ok(!hasError(emitted))
          assert.strictEqual(response.statusCode, 200)
          assert.strictEqual(response.headers['Content-Type'], textMimeType)
          assert.strictEqual(response.toString(), 'Hello World!')
        })
    })

    it('avoids path traversal by normalizing the URL if needed (using intermediate %2E%2E/)', () => {
      const request = new Request('GET')
      request.setForgedUrl('/test/%2E%2E/file.txt')
      return dispatch({ request })
        .then(({ emitted, response }) => {
          assert.ok(!hasError(emitted))
          assert.strictEqual(response.statusCode, 200)
          assert.strictEqual(response.headers['Content-Type'], textMimeType)
          assert.strictEqual(response.toString(), 'Hello World!')
        })
    })

    it('works around poison null attack', () => {
      const request = new Request('GET')
      request.setForgedUrl('/test/%2E%2E/file%00.txt')
      return dispatch({ request })
        .then(({ emitted, response }) => {
          assert.ok(!hasError(emitted))
          assert.strictEqual(response.statusCode, 200)
          assert.strictEqual(response.headers['Content-Type'], textMimeType)
          assert.strictEqual(response.toString(), 'Hello World!')
        })
    })

    for (let i = 1; i < 32; ++i) {
      it('works around forbidden chars', () => {
        const request = new Request('GET')
        request.setForgedUrl(`/test/%2E%2E/file%${Number(i).toString(8).padStart(2, '0')}.txt`)
        return dispatch({ request })
          .then(({ emitted, response }) => {
            assert.ok(!hasError(emitted))
            assert.strictEqual(response.statusCode, 200)
            assert.strictEqual(response.headers['Content-Type'], textMimeType)
            assert.strictEqual(response.toString(), 'Hello World!')
          })
      })
    }

    it('rejects malformed URLs', () => {
      const request = new Request('GET')
      request.setForgedUrl('/test/%2E%2E/file%0.txt')
      return dispatch({ request })
        .then(({ emitted, response }) => {
          assert.ok(!hasError(emitted))
          assert.strictEqual(response.statusCode, 400)
        })
    })
  })
})
