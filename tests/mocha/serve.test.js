'use strict'

const assert = require('./assert')
const serve = require('../../serve')
const { read } = require('../../configuration')

function promisify (configuration, callback) {
  return new Promise((resolve, reject) => {
    serve(configuration)
      .on('error', reject)
      .on('ready', parameters => {
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

function promisifyWithError (configuration, checkError) {
  return new Promise((resolve, reject) => {
    serve(configuration)
      .on('error', ({ reason }) => {
        try {
          checkError(reason)
          resolve()
        } catch (e) {
          /* istanbul ignore next */ // We don't expect it to happen !
          reject(e)
        }
      })
      .on('ready', reject)
  })
}

describe('serve', () => {
  it('allocates http server', () => promisify({
    hostname: '127.0.0.1',
    port: 3475
  }, ({ url }) => {
    assert(() => url === 'http://127.0.0.1:3475/')
  }))

  it('allocates a port', () => promisify({
    hostname: '127.0.0.1',
    port: 'auto'
  }, ({ url }) => {
    assert(() => url === 'http://127.0.0.1:34750/')
  }))

  it('allocates https server', () => read('/folder/reserve-with-another-port.json')
    .then(configuration => promisify(configuration, ({ url }) => {
      assert(() => url === 'https://0.0.0.0:220103/')
    }))
  )

  it('transmits server creation error', () => promisifyWithError({
    hostname: 'error'
  }, reason => {
    assert(() => reason.message === 'error')
  }))

  it('fails if a listener registration throws an exception', () => promisifyWithError({
    listeners: [eventEmitter => {
      throw new Error('immediate')
    }],
    hostname: '127.0.0.1',
    port: 3475
  }, reason => {
    assert(() => reason.message === 'immediate')
  }))

  it('fails if a listener throws an exception during server-create', () => promisifyWithError({
    listeners: [eventEmitter => {
      eventEmitter.on('server-created', () => {
        throw new Error('server-created')
      })
    }],
    hostname: '127.0.0.1',
    port: 3475
  }, reason => {
    assert(() => reason.message === 'server-created')
  }))

  it('provides server instance to listeners (server-created)', () => promisify({
    listeners: [eventEmitter => {
      eventEmitter.on('server-created', ({ server }) => {
        assert(() => !!server)
      })
    }],
    hostname: '127.0.0.1',
    port: 3475
  }, ({ url }) => {
    assert(() => url === 'http://127.0.0.1:3475/')
  }))
})
