'use strict'

const assert = require('./assert')
const mime = require('../../detect/mime')
const EventEmitter = require('events')
const Request = require('../../mock/Request')
const Response = require('../../mock/Response')
const { check } = require('../../index')
const dispatcher = require('../../dispatcher')

const textMimeType = mime.getType('text')
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
    match: '/redirect',
    custom: async function redirect () {
      return '/file.txt'
    }
  }, {
    match: '/404',
    custom: async function err404 () {
      return 404
    }
  }, {
    match: '/fail',
    fail: true
  }, {
    match: '/throw',
    custom: function throw_ () {
      throw new Error()
    }
  }, {
    match: '/reject',
    custom: function reject () {
      return Promise.reject(new Error())
    }
  }, {
    match: '(.*)',
    custom: async function setXFlag (request, response) {
      response.setHeader('x-flag', 'true')
    }
  }, {
    match: '/file.txt',
    'invert-match': true,
    custom: async function setXNotFile (request, response) {
      response.setHeader('x-not-file', 'true')
    }
  }, {
    method: 'GET',
    match: '/if-match.txt',
    'if-match': function (request, url, match) {
      if (request.headers['x-prevent-match']) {
        return false
      }
      return request.headers['x-match-redirect'] || true
    },
    custom: async function IfMatch (request, response) {
      response.writeHead(200, { 'Content-Type': textMimeType })
      response.end('if-match')
    }
  }, {
    match: '/subst/(.*)/(.*)',
    file: '/$1.$2'
  }, {
    match: '/subst-complex/(.*)/(.*)',
    file: '/$1$$1.$2$3'
  }, {
    match: '/file.txt',
    file: '/file.txt'
  }]
})

class RecordedEventEmitter extends EventEmitter {
  constructor () {
    super()
    this._emitted = []
  }

  emit (eventName, ...args) {
    this._emitted.push({
      eventName,
      parameters: Object.assign({}, args[0])
    })
    super.emit(eventName, ...args)
  }

  get emitted () {
    return this._emitted
  }

  get hasError () {
    return this._emitted.filter(event => event.eventName === 'error').length !== 0
  }
}

function absorbError () {}

async function dispatch ({ configurationPromise, events, request }) {
  const { abort } = request
  if (typeof request === 'string') {
    request = { method: 'GET', url: request }
  }
  request = new Request(request)
  if (!configurationPromise) {
    configurationPromise = defaultConfigurationPromise
  }
  const configuration = await configurationPromise
  const response = new Response()
  const emitter = new RecordedEventEmitter()
  if (events) {
    Object.keys(events).forEach(eventName => emitter.on(eventName, events[eventName]))
  } else {
    emitter.on('error', absorbError)
  }
  const promise = dispatcher.call(emitter, configuration, request, response)
  if (abort) {
    request.abort()
  }
  await promise
  return {
    emitter,
    request,
    response
  }
}

describe('dispatcher', () => {
  describe('events', () => {
    let firstRequestId

    it('provides request information on incoming and redirecting', () => dispatch({ request: '/redirect' })
      .then(({ emitter, promise, response }) => {
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.toString() === 'Hello World!')
        const [incoming, redirecting] = emitter.emitted
        assert(() => incoming.eventName === 'incoming')
        assert(() => incoming.parameters.method === 'GET')
        assert(() => incoming.parameters.url === '/redirect')
        assert(() => typeof incoming.parameters.id === 'number')
        assert(() => incoming.parameters.start instanceof Date)
        firstRequestId = incoming.parameters.id
        assert(() => redirecting.eventName === 'redirecting')
        assert(() => redirecting.parameters.id === firstRequestId)
      })
    )

    it('detects request abortion', () => dispatch({ request: { method: 'GET', url: '/redirect', abort: true } })
      .then(({ emitter, promise, response }) => {
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.toString() === '')
        const [incoming, aborted] = emitter.emitted
        assert(() => incoming.eventName === 'incoming')
        assert(() => incoming.parameters.method === 'GET')
        assert(() => incoming.parameters.url === '/redirect')
        assert(() => typeof incoming.parameters.id === 'number')
        assert(() => incoming.parameters.id !== firstRequestId)
        assert(() => incoming.parameters.start instanceof Date)
        const secondRequestId = incoming.parameters.id
        assert(() => aborted.eventName === 'aborted')
        assert(() => aborted.parameters.id === secondRequestId)
      })
    )
  })

  describe('redirection', () => {
    it('supports internal redirection', () => dispatch({ request: '/redirect' })
      .then(({ emitter, response }) => {
        assert(() => !emitter.hasError)
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.toString() === 'Hello World!')
      })
    )

    it('supports internal status code', () => dispatch({ request: '/404' })
      .then(({ emitter, response }) => {
        assert(() => !emitter.hasError)
        assert(() => response.statusCode === 404)
      })
    )
  })

  describe('regexp matching', () => {
    it('supports capturing groups substitution', () => dispatch({ request: '/subst/file/txt' })
      .then(({ emitter, response }) => {
        assert(() => !emitter.hasError)
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.toString() === 'Hello World!')
      })
    )

    it('supports capturing groups substitution (complex)', () => dispatch({ request: '/subst-complex/file/txt' })
      .then(({ emitter, response }) => {
        assert(() => !emitter.hasError)
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.toString() === '$1')
      })
    )
  })

  describe('method matching', () => {
    it('matches the mapping method', () => dispatch({ request: { method: 'INFO', url: '/file.txt' } })
      .then(({ emitter, response }) => {
        assert(() => !emitter.hasError)
        assert(() => response.statusCode === 405)
      })
    )

    it('matches the handler method (no matching)', () => dispatch({ request: { method: 'POST', url: '/file.txt' } })
      .then(({ emitter, response }) => {
        assert(() => emitter.hasError)
        assert(() => response.statusCode === 501)
      })
    )
  })

  describe('invert-match', () => {
    it('protects against unwanted verbs', () => dispatch({ request: { method: 'PUT', url: '/file.txt' } })
      .then(({ emitter, response }) => {
        assert(() => !emitter.hasError)
        assert(() => response.statusCode === 405)
      })
    )

    it('enables all but matching', () => dispatch({ request: { method: 'GET', url: '/file2.txt' } })
      .then(({ emitter, response }) => {
        assert(() => response.headers['x-not-file'] === 'true')
        assert(() => response.statusCode === 501)
      })
    )

    it('enables all but matching (not matching)', () => dispatch({ request: { method: 'GET', url: '/file.txt' } })
      .then(({ emitter, response }) => {
        assert(() => response.headers['x-not-file'] === undefined)
        assert(() => response.statusCode === 200)
      })
    )
  })

  describe('if-match', () => {
    it('is not triggered if the mapping does not match', () => dispatch({ request: '/if-not-match.txt' })
      .then(({ emitter, response }) => {
        assert(() => emitter.hasError)
        assert(() => response.statusCode === 501)
      })
    )

    it('decides of the final match', () => dispatch({ request: { method: 'GET', url: '/if-match.txt', headers: { 'x-prevent-match': true } } })
      .then(({ emitter, response }) => {
        assert(() => emitter.hasError)
        assert(() => response.statusCode === 501)
      })
    )

    it('enables redirect', () => dispatch({ request: { method: 'GET', url: '/if-match.txt', headers: { 'x-match-redirect': 508 } } })
    .then(({ emitter, response }) => {
      assert(() => !emitter.hasError)
      assert(() => response.statusCode === 508)
    })
  )
  })

  describe('handlers', () => {
    it('redirects a request to the right handler', () => dispatch({ request: '/file.txt' })
      .then(({ emitter, response }) => {
        assert(() => !emitter.hasError)
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.toString() === 'Hello World!')
      })
    )

    it('allows handlers that don\'t finalize response', () => dispatch({ request: '/file.txt' })
      .then(({ emitter, response }) => {
        assert(() => !emitter.hasError)
        assert(() => response.headers['x-flag'] === 'true')
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.toString() === 'Hello World!')
      })
    )
  })

  describe('Error handling', () => {
    describe('Internal errors', () => {
      it('supports internal handler error', () => dispatch({ request: '/fail' })
        .then(({ emitter, response }) => {
          assert(() => emitter.hasError)
          assert(() => response.statusCode === 500)
        })
      )

      it('supports internal custom error', () => dispatch({ request: '/throw' })
        .then(({ emitter, response }) => {
          assert(() => emitter.hasError)
          assert(() => response.statusCode === 500)
        })
      )

      it('supports internal promise rejection', () => dispatch({ request: '/reject' })
        .then(({ emitter, response }) => {
          assert(() => emitter.hasError)
          assert(() => response.statusCode === 500)
        })
      )
    })

    describe('No handler for the request', () => {
      it('fails with error 501', () => dispatch({ request: '/unhandled' })
        .then(({ emitter, response }) => {
          assert(() => emitter.hasError)
          assert(() => response.statusCode === 501)
        })
      )

      it('logs error 501', () => dispatch({ request: '/unhandled' })
        .then(({ emitter, response }) => {
          const error = emitter.emitted.filter(event => event.eventName === 'error')[0]
          assert(() => error.parameters.method === 'GET')
          assert(() => error.parameters.url === '/unhandled')
          assert(() => typeof error.parameters.id === 'number')
          assert(() => error.parameters.reason === 501)
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
        .then(({ emitter, response }) => {
          assert(() => emitter.hasError)
          assert(() => response.statusCode === 508)
        })
      )

      it('prevents infinite loops in error handling', () => dispatch({ configurationPromise: loopConfigurationPromise, request: 'error' })
        .then(({ emitter, response }) => {
          assert(() => emitter.hasError)
          assert(() => !response.statusCode)
        })
      )
    })

    describe('listeners', () => {
      it('fails the request if the \'incoming\' listener fails', () => dispatch({
        request: '/file.txt',
        events: {
          error: absorbError,
          incoming: () => { throw new Error('FAIL') }
        }
      })
        .then(({ emitter, response }) => {
          assert(() => emitter.hasError)
          assert(() => response.statusCode === 500)
        })
      )

      it('fails the request if the \'redirecting\' listener fails', () => dispatch({
        request: '/file.txt',
        events: {
          error: absorbError,
          redirecting: () => { throw new Error('FAIL') }
        }
      })
        .then(({ emitter, response }) => {
          assert(() => emitter.hasError)
          assert(() => response.statusCode === undefined) // Because it never completes the request
        })
      )

      it('does not fail the request if the \'error\' listener fails', () => dispatch({
        request: '/fail',
        events: {
          error: () => { throw new Error('FAIL') }
        }
      })
        .then(({ emitter, response }) => {
          assert(() => response.statusCode === 500)
        })
      )

      it('does not fail the request if the \'redirected\' listener fails', () => dispatch({
        request: '/file.txt',
        events: {
          error: absorbError,
          redirected: () => { throw new Error('FAIL') }
        }
      })
        .then(({ emitter, response }) => {
          assert(() => emitter.hasError)
          assert(() => response.statusCode === 200)
          assert(() => response.headers['Content-Type'] === textMimeType)
          assert(() => response.toString() === 'Hello World!')
        })
      )
    })
  })
})
