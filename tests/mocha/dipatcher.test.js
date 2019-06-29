'use strict'

const assert = require('assert')
const mime = require('mime')
const EventEmitter = require('events')
const Request = require('./Request')
const Response = require('./Response')
const checkConfiguration = require('../../configuration')
const dispatcher = require('../../dispatcher')

const textMimeType = mime.getType('text')
const handlers = {
  custom: require('../../handlers/custom'),
  file: require('../../handlers/file'),
  status: require('../../handlers/status'),
  url: require('../../handlers/url')
}

const sampleConfPromise = checkConfiguration({
  handlers,
  mappings: [{
    match: '/redirect',
    custom: async () => '/file.txt'
  }, {
    match: '/404',
    custom: async () => 404
  }, {
    match: '/throw',
    custom: () => { throw new Error() }
  }, {
    match: '/reject',
    custom: () => Promise.reject(new Error())
  }, {
    match: '(.*)',
    custom: async (request, response) => {
      response.setHeader('x-flag', 'true')
    }
  }, {
    match: '/subst/(.*)/(.*)',
    file: '/$1.$2'
  }, {
    match: '(.*)',
    file: '/$1'
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
    dispatcher.call(emitter, sampleConf, request, response)
    return new Promise((resolve, reject) => {
      emitter
        .on('error', parameters => reject(parameters.error))
        .on('redirected', parameters => {
          assert(() => response.statusCode === 200)
          assert(() => response.headers['Content-Type'] === textMimeType)
          assert(() => response.toString() === 'Hello World!')
          resolve()
        })
    })
  })

  it('supports capturing groups substitution', async () => {
    const sampleConf = await sampleConfPromise
    const request = new Request('GET', '/subst/file/txt')
    const response = new Response()
    const emitter = new RecordedEventEmitter()
    dispatcher.call(emitter, sampleConf, request, response)
    return new Promise((resolve, reject) => {
      emitter
        .on('error', parameters => reject(parameters.error))
        .on('redirected', parameters => {
          assert(() => response.statusCode === 200)
          assert(() => response.headers['Content-Type'] === textMimeType)
          assert(() => response.toString() === 'Hello World!')
          resolve()
        })
    })
  })

  it('supports internal redirection', async () => {
    const sampleConf = await sampleConfPromise
    const request = new Request('GET', '/redirect')
    const response = new Response()
    const emitter = new RecordedEventEmitter()
    dispatcher.call(emitter, sampleConf, request, response)
    return new Promise((resolve, reject) => {
      emitter
        .on('error', parameters => reject(parameters.error))
        .on('redirected', parameters => {
          assert(() => response.statusCode === 200)
          assert(() => response.headers['Content-Type'] === textMimeType)
          assert(() => response.toString() === 'Hello World!')
          resolve()
        })
    })
  })

  it('supports internal status code', async () => {
    const sampleConf = await sampleConfPromise
    const request = new Request('GET', '/404')
    const response = new Response()
    const emitter = new RecordedEventEmitter()
    dispatcher.call(emitter, sampleConf, request, response)
    return new Promise((resolve, reject) => {
      emitter
        .on('error', parameters => reject(parameters.error))
        .on('redirected', parameters => {
          assert(() => response.statusCode === 404)
          resolve()
        })
    })
  })

  it('supports internal error', async () => {
    const sampleConf = await sampleConfPromise
    const request = new Request('GET', '/throw')
    const response = new Response()
    const emitter = new RecordedEventEmitter()
    dispatcher.call(emitter, sampleConf, request, response)
    return new Promise((resolve, reject) => {
      let errorThrown = false
      emitter
        .on('error', () => { errorThrown = true })
        .on('redirected', parameters => {
          assert(() => response.statusCode === 500)
          assert(() => errorThrown)
          resolve()
        })
    })
  })

  it('supports internal promise rejection', async () => {
    const sampleConf = await sampleConfPromise
    const request = new Request('GET', '/reject')
    const response = new Response()
    const emitter = new RecordedEventEmitter()
    dispatcher.call(emitter, sampleConf, request, response)
    return new Promise((resolve, reject) => {
      let errorThrown = false
      emitter
        .on('error', () => { errorThrown = true })
        .on('redirected', parameters => {
          assert(() => response.statusCode === 500)
          assert(() => errorThrown)
          resolve()
        })
    })
  })

  it('allows handlers that don\'t finalize response', async () => {
    const sampleConf = await sampleConfPromise
    const request = new Request('GET', '/file.text')
    const response = new Response()
    const emitter = new RecordedEventEmitter()
    dispatcher.call(emitter, sampleConf, request, response)
    return new Promise((resolve, reject) => {
      emitter
        .on('error', parameters => reject(parameters.error))
        .on('redirected', parameters => {
          assert(() => response.headers['x-flag'] === 'true')
          assert(() => response.statusCode === 200)
          assert(() => response.headers['Content-Type'] === textMimeType)
          assert(() => response.toString() === 'Hello World!')
          resolve()
        })
    })
  })
})
