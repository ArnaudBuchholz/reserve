'use strict'

const assert = require('./assert')
const mime = require('../../detect/mime')
const EventEmitter = require('events')
const Request = require('./Request')
const Response = require('./Response')
const { check } = require('../../configuration')
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

  get emitted () {
    /* istanbul ignore next */ // Not used yet
    return this._emitted
  }
}

describe('dispatcher', () => {
  function promisify (emitter, callback) {
    return new Promise((resolve, reject) => {
      emitter
        .on('error', parameters => {
          /* istanbul ignore next */ // We don't expect it to happen !
          reject(parameters.error)
        })
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
    const promise = promisify(emitter, parameters => {
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
    const promise = promisify(emitter, parameters => {
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
    const promise = promisify(emitter, parameters => {
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
    const promise = promisify(emitter, parameters => {
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
    const promise = promisify(emitter, parameters => {
      assert(() => response.headers['x-flag'] === 'true')
      assert(() => response.statusCode === 200)
      assert(() => response.headers['Content-Type'] === textMimeType)
      assert(() => response.toString() === 'Hello World!')
    })
    dispatcher.call(emitter, sampleConf, request, response)
    return promise
  })

  it('fails when no mapping finalizes the request', async () => {
    const sampleConf = await sampleConfPromise
    const request = new Request('GET', '/unhandled')
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
