'use strict'

const assert = require('./assert')
const mime = require('mime')
const EventEmitter = require('events')
const Request = require('./Request')
const Response = require('./Response')
const { check } = require('../../configuration')
const dispatcher = require('../../dispatcher')

const textMimeType = mime.getType('text')
const sampleConfPromise = check({
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

describe('dispatcher', () => {
  it('redirects a request to the right handler', async () => {
    const sampleConf = await sampleConfPromise
    const request = new Request('GET', '/file.txt')
    const response = new Response()
    const emitter = new RecordedEventEmitter()
    return new Promise((resolve, reject) => {
      emitter
        .on('error', parameters => reject(parameters.error))
        .on('redirected', parameters => {
          try {
            assert(() => response.statusCode === 200)
            assert(() => response.headers['Content-Type'] === textMimeType)
            assert(() => response.toString() === 'Hello World!')
            resolve()
          } catch (e) {
            reject(e)
          }
        })
      dispatcher.call(emitter, sampleConf, request, response)
    })
  })

  it('supports capturing groups substitution', async () => {
    const sampleConf = await sampleConfPromise
    const request = new Request('GET', '/subst/file/txt')
    const response = new Response()
    const emitter = new RecordedEventEmitter()
    return new Promise((resolve, reject) => {
      emitter
        .on('error', parameters => reject(parameters.error))
        .on('redirected', parameters => {
          try {
            assert(() => response.statusCode === 200)
            assert(() => response.headers['Content-Type'] === textMimeType)
            assert(() => response.toString() === 'Hello World!')
            resolve()
          } catch (e) {
            reject(e)
          }
        })
      dispatcher.call(emitter, sampleConf, request, response)
    })
  })

  it('supports internal redirection', async () => {
    const sampleConf = await sampleConfPromise
    const request = new Request('GET', '/redirect')
    const response = new Response()
    const emitter = new RecordedEventEmitter()
    return new Promise((resolve, reject) => {
      emitter
        .on('error', parameters => reject(parameters.error))
        .on('redirected', parameters => {
          try {
            assert(() => response.statusCode === 200)
            assert(() => response.headers['Content-Type'] === textMimeType)
            assert(() => response.toString() === 'Hello World!')
            resolve()
          } catch (e) {
            reject(e)
          }
        })
      dispatcher.call(emitter, sampleConf, request, response)
    })
  })

  it('supports internal status code', async () => {
    const sampleConf = await sampleConfPromise
    const request = new Request('GET', '/404')
    const response = new Response()
    const emitter = new RecordedEventEmitter()
    return new Promise((resolve, reject) => {
      emitter
        .on('error', parameters => reject(parameters.error))
        .on('redirected', parameters => {
          try {
            assert(() => response.statusCode === 404)
            resolve()
          } catch (e) {
            reject(e)
          }
        })
      dispatcher.call(emitter, sampleConf, request, response)
    })
  })

  it('supports internal error', async () => {
    const sampleConf = await sampleConfPromise
    const request = new Request('GET', '/throw')
    const response = new Response()
    const emitter = new RecordedEventEmitter()
    return new Promise((resolve, reject) => {
      let errorThrown = false
      emitter
        .on('error', () => { errorThrown = true })
        .on('redirected', parameters => {
          try {
            assert(() => response.statusCode === 500)
            assert(() => errorThrown)
            resolve()
          } catch (e) {
            reject(e)
          }
        })
      dispatcher.call(emitter, sampleConf, request, response)
    })
  })

  it('supports internal promise rejection', async () => {
    const sampleConf = await sampleConfPromise
    const request = new Request('GET', '/reject')
    const response = new Response()
    const emitter = new RecordedEventEmitter()
    return new Promise((resolve, reject) => {
      let errorThrown = false
      emitter
        .on('error', () => { errorThrown = true })
        .on('redirected', parameters => {
          try {
            assert(() => response.statusCode === 500)
            assert(() => errorThrown)
            resolve()
          } catch (e) {
            reject(e)
          }
        })
      dispatcher.call(emitter, sampleConf, request, response)
    })
  })

  it('allows handlers that don\'t finalize response', async () => {
    const sampleConf = await sampleConfPromise
    const request = new Request('GET', '/file.txt')
    const response = new Response()
    const emitter = new RecordedEventEmitter()
    return new Promise((resolve, reject) => {
      emitter
        .on('error', parameters => reject(parameters.error))
        .on('redirected', parameters => {
          try {
            assert(() => response.headers['x-flag'] === 'true')
            assert(() => response.statusCode === 200)
            assert(() => response.headers['Content-Type'] === textMimeType)
            assert(() => response.toString() === 'Hello World!')
            resolve()
          } catch (e) {
            reject(e)
          }
        })
      dispatcher.call(emitter, sampleConf, request, response)
    })
  })

  it('fails when no mapping finalizes the request', async () => {
    const sampleConf = await sampleConfPromise
    const request = new Request('GET', '/unhandled')
    const response = new Response()
    const emitter = new RecordedEventEmitter()
    return new Promise((resolve, reject) => {
      let errorThrown = false
      emitter
        .on('error', () => { errorThrown = true })
        .on('redirected', parameters => {
          try {
            assert(() => response.statusCode === 500)
            assert(() => errorThrown)
            resolve()
          } catch (e) {
            reject(e)
          }
        })
      dispatcher.call(emitter, sampleConf, request, response)
    })
  })
})
