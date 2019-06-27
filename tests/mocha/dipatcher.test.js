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

const fileConfPromise = checkConfiguration({
  handlers,
  mappings: [{
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
  it('redirect a request to the right handler', async function () {
    const fileConf = await fileConfPromise
    const request = new Request('GET', '/file.txt')
    const response = new Response()
    const emitter = new RecordedEventEmitter()
    dispatcher.call(emitter, fileConf, request, response)
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
})
