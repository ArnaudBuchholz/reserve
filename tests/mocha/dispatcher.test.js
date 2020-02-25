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

  it('supports internal redirection', async () => {
    const sampleConf = await sampleConfPromise
    const request = new Request('GET', '/redirect')
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

  it('supports internal status code', async () => {
    const sampleConf = await sampleConfPromise
    const request = new Request('GET', '/404')
    const response = new Response()
    const emitter = new RecordedEventEmitter()
    const promise = promisify(emitter, parameters => {
      assert(() => response.statusCode === 404)
    })
    dispatcher.call(emitter, sampleConf, request, response)
    return promise
  })

  function promisifyWithError (emitter, callback) {
    let errorThrown
    return new Promise((resolve, reject) => {
      emitter
        .on('error', () => {
          errorThrown = true
        })
        .on('redirected', parameters => {
          try {
            callback(parameters, errorThrown)
            resolve()
          } catch (e) {
            /* istanbul ignore next */ // We don't expect it to happen !
            reject(e)
          }
        })
    })
  }

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

  describe('Error handling', () => {
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
  })
})
