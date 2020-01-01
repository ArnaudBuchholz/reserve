'use strict'

const assert = require('./assert')
const serve = require('../../serve')
const { read } = require('../../configuration')

function promisify (configuration, callback) {
  return new Promise((resolve, reject) => {
    /* istanbul ignore next */ // We don't expect it to happen !
    function unexpectedError (parameters) {
      reject(parameters.error)
    }

    serve(configuration)
      .on('error', unexpectedError)
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

describe('serve', () => {
  it('allocates http server', () => promisify({
    hostname: '127.0.0.1',
    port: 3475
  }, ({ url }) => {
    assert(() => url === 'http://127.0.0.1:3475/')
  }))

  it('allocates https server', () => read('/folder/reserve-with-another-port.json')
    .then(configuration => promisify(configuration, ({ url }) => {
      assert(() => url === 'https://0.0.0.0:220103/')
    }))
  )

  it('transmits server creation error', done => {
    /* istanbul ignore next */ // We don't expect it to happen !
    function unexpectedReady () {
      done(new Error('unexpected'))
    }

    serve({
      hostname: 'error'
    })
      .on('error', parameters => {
        try {
          assert(() => parameters.reason.message === 'error')
          done()
        } catch (e) {
          /* istanbul ignore next */ // We don't expect it to happen !
          done(e)
        }
      })
      .on('ready', unexpectedReady)
  })
})
