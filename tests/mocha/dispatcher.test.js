'use strict'

const assert = require('./assert')
const mime = require('../../detect/mime')
const EventEmitter = require('events')
const Request = require('../../mock/Request')
const Response = require('../../mock/Response')
const { check, mock, log } = require('../../index')
const dispatcher = require('../../dispatcher')

const textMimeType = mime.getType('text')
const sampleConfPromise = check({
  handlers: {
    fail: {
      redirect: function fail () {
        throw new Error('FAIL')
      }
    }
  },
  mappings: [{
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
    super.emit(eventName, ...args)
    this._emitted.push({
      eventName,
      parameters: Object.assign({}, args[0])
    })
  }

  get emitted () {
    return this._emitted
  }
}

async function dispatch ({ abort, expectError, request }) {
  if (typeof request === 'string') {
    request = { method: 'GET', url: request }
  }
  request = new Request(request)
  const sampleConf = await sampleConfPromise
  const response = new Response()
  const emitter = new RecordedEventEmitter()
  const promise = dispatcher.call(emitter, sampleConf, request, response)
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
  function promisify (emitter, callback) {
    return new Promise((resolve, reject) => {
      /* istanbul ignore next */ // We don't expect it to happen !
      function unexpectedError (parameters) {
        reject(parameters.error)
      }

      emitter
        .on('error', unexpectedError)
        .on('redirected', async parameters => {
          try {
            await callback(parameters)
            resolve()
          } catch (e) {
            /* istanbul ignore next */ // We don't expect it to happen !
            reject(e)
          }
        })
    })
  }

  function promisifyWithError (emitter, callback) {
    let errorThrown
    return new Promise((resolve, reject) => {
      emitter
        .on('error', () => {
          errorThrown = true
        })
        .on('redirected', async parameters => {
          try {
            await callback(parameters, errorThrown)
            resolve()
          } catch (e) {
            /* istanbul ignore next */ // We don't expect it to happen !
            reject(e)
          }
        })
    })
  }

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

    it('detects request abortion', () => dispatch({ abort: true, request: '/redirect' })
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
      .then(({ response }) => {
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.toString() === 'Hello World!')
      })
    )

    it('supports internal status code', async () => {
      const sampleConf = await sampleConfPromise
      const request = new Request('GET', '/404')
      const response = new Response()
      const emitter = new RecordedEventEmitter()
      const promise = promisify(emitter, async parameters => {
        assert(() => response.statusCode === 404)
      })
      dispatcher.call(emitter, sampleConf, request, response)
      return promise
    })
  })

  describe('regexp matching', () => {
    it('supports capturing groups substitution', async () => {
      const sampleConf = await sampleConfPromise
      const request = new Request('GET', '/subst/file/txt')
      const response = new Response()
      const emitter = new RecordedEventEmitter()
      const promise = promisify(emitter, async parameters => {
        await response.waitForFinish()
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.toString() === 'Hello World!')
      })
      dispatcher.call(emitter, sampleConf, request, response)
      return promise
    })

    it('supports capturing groups substitution (complex)', async () => {
      const sampleConf = await sampleConfPromise
      const request = new Request('GET', '/subst-complex/file/txt')
      const response = new Response()
      const emitter = new RecordedEventEmitter()
      const promise = promisify(emitter, async parameters => {
        await response.waitForFinish()
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.toString() === '$1')
      })
      dispatcher.call(emitter, sampleConf, request, response)
      return promise
    })
  })

  describe('method matching', () => {
    it('matches the mapping method', async () => {
      const sampleConf = await sampleConfPromise
      const request = new Request('INFO', '/file.txt')
      const response = new Response()
      const emitter = new RecordedEventEmitter()
      const promise = promisify(emitter, async () => {
        await response.waitForFinish()
        assert(() => response.statusCode === 405)
      })
      dispatcher.call(emitter, sampleConf, request, response)
      return promise
    })

    it('matches the handler method (no matching)', async () => {
      const sampleConf = await sampleConfPromise
      const request = new Request('POST', '/file.txt')
      const response = new Response()
      const emitter = new RecordedEventEmitter()
      const promise = promisifyWithError(emitter, async (parameters, errorThrown) => {
        assert(() => errorThrown)
        assert(() => response.statusCode === 501)
      })
      dispatcher.call(emitter, sampleConf, request, response)
      return promise
    })
  })

  describe('handlers', () => {
    it('redirects a request to the right handler', async () => {
      const sampleConf = await sampleConfPromise
      const request = new Request('GET', '/file.txt')
      const response = new Response()
      const emitter = new RecordedEventEmitter()
      const promise = promisify(emitter, async parameters => {
        await response.waitForFinish()
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.toString() === 'Hello World!')
      })
      dispatcher.call(emitter, sampleConf, request, response)
      return promise
    })

    it('allows handlers that don\'t finalize response', async () => {
      const sampleConf = await sampleConfPromise
      const request = new Request('GET', '/file.txt')
      const response = new Response()
      const emitter = new RecordedEventEmitter()
      const promise = promisify(emitter, async parameters => {
        await response.waitForFinish()
        assert(() => response.headers['x-flag'] === 'true')
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.toString() === 'Hello World!')
      })
      dispatcher.call(emitter, sampleConf, request, response)
      return promise
    })
  })

  describe('Error handling', () => {
    describe('Internal errors', () => {
      it('supports internal handler error', async () => {
        const sampleConf = await sampleConfPromise
        const request = new Request('GET', '/fail')
        const response = new Response()
        const emitter = new RecordedEventEmitter()
        const promise = promisifyWithError(emitter, (parameters, errorThrown) => {
          assert(() => response.statusCode === 500)
          assert(() => errorThrown)
        })
        dispatcher.call(emitter, sampleConf, request, response)
        return promise
      })

      it('supports internal custom error', async () => {
        const sampleConf = await sampleConfPromise
        const request = new Request('GET', '/throw')
        const response = new Response()
        const emitter = new RecordedEventEmitter()
        const promise = promisifyWithError(emitter, (parameters, errorThrown) => {
          assert(() => response.statusCode === 500)
          assert(() => errorThrown)
        })
        dispatcher.call(emitter, sampleConf, request, response)
        return promise
      })

      it('supports internal promise rejection', async () => {
        const sampleConf = await sampleConfPromise
        const request = new Request('GET', '/reject')
        const response = new Response()
        const emitter = new RecordedEventEmitter()
        const promise = promisifyWithError(emitter, (parameters, errorThrown) => {
          assert(() => response.statusCode === 500)
          assert(() => errorThrown)
        })
        dispatcher.call(emitter, sampleConf, request, response)
        return promise
      })
    })

    function promisifyNoError (emitter, callback) {
      return new Promise((resolve, reject) => {
        emitter
          .on('redirected', parameters => {
            try {
              callback(parameters)
              resolve()
            } catch (e) {
              /* istanbul ignore next */ // We don't expect it to happen !
              reject(e)
            }
          })
      })
    }

    describe('No handler for the request', () => {
      it('fails with error 501', async () => {
        const sampleConf = await sampleConfPromise
        const request = new Request('GET', '/unhandled')
        const response = new Response()
        const emitter = new RecordedEventEmitter()
        const promise = promisifyWithError(emitter, (parameters, errorThrown) => {
          assert(() => response.statusCode === 501)
          assert(() => errorThrown)
        })
        dispatcher.call(emitter, sampleConf, request, response)
        return promise
      })

      it('logs error 501', async () => {
        const sampleConf = await sampleConfPromise
        const request = new Request('GET', '/unhandled')
        const response = new Response()
        const emitter = new RecordedEventEmitter()
        const promise = promisifyNoError(emitter, parameters => {
          assert(() => response.statusCode === 501)
        })
        dispatcher.call(emitter, sampleConf, request, response)
        return promise
      })
    })

    describe('Infinite loop', () => {
      let mocked

      before(async () => {
        mocked = await mock({
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
      })

      it('prevents infinite redirection', () => mocked.request('GET', 'a')
        .then(response => {
          assert(() => response.statusCode === 508)
        })
      )

      it('prevents infinite loops in error handling', () => log(mocked, true).request('GET', 'error')
        .then(response => {
          assert(() => !response.statusCode)
        })
      )
    })

    describe('listeners', () => {
      it('fails the request if the \'incoming\' listener fails', async () => {
        const sampleConf = await sampleConfPromise
        const request = new Request('GET', '/file.txt')
        const response = new Response()
        const emitter = new RecordedEventEmitter()
        emitter.on('incoming', () => {
          throw new Error('FAIL')
        })
        const promise = promisifyWithError(emitter, async (parameters, errorThrown) => {
          assert(() => errorThrown)
          assert(() => response.statusCode === 500)
        })
        dispatcher.call(emitter, sampleConf, request, response)
        return promise
      })

      it('fails the request if the \'redirecting\' listener fails', async () => {
        const sampleConf = await sampleConfPromise
        const request = new Request('GET', '/file.txt')
        const response = new Response()
        const emitter = new RecordedEventEmitter()
        emitter.on('redirecting', () => {
          throw new Error('FAIL')
        })
        const promise = promisifyWithError(emitter, async (parameters, errorThrown) => {
          assert(() => errorThrown)
          assert(() => response.statusCode === undefined) // Because it never completes the request
        })
        dispatcher.call(emitter, sampleConf, request, response)
        return promise
      })

      it('does not fail the request if the \'error\' listener fails', async () => {
        const sampleConf = await sampleConfPromise
        const request = new Request('GET', '/fail')
        const response = new Response()
        const emitter = new RecordedEventEmitter()
        emitter.on('error', () => {
          throw new Error('FAIL')
        })
        return dispatcher.call(emitter, sampleConf, request, response)
          .then(() => {
            assert(() => response.statusCode === 500)
          })
      })

      it('does not fail the request if the \'redirected\' listener fails', async () => {
        const sampleConf = await sampleConfPromise
        const request = new Request('GET', '/file.txt')
        const response = new Response()
        const emitter = new RecordedEventEmitter()
        emitter.on('redirected', () => {
          throw new Error('FAIL')
        })
        return dispatcher.call(emitter, sampleConf, request, response)
          .then(async () => {
            await response.waitForFinish()
            assert(() => response.statusCode === 200)
            assert(() => response.headers['Content-Type'] === textMimeType)
            assert(() => response.toString() === 'Hello World!')
          })
      })
    })
  })
})
