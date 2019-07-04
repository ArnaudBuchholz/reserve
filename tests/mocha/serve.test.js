'use strict'

const assert = require('./assert')
const serve = require('../../serve')
const { read } = require('../../configuration')

describe('serve', () => {
  it('allocates http server', done => {
    serve({
      port: 3475
    })
      .on('error', parameters => done(parameters.error))
      .on('ready', ({ url }) => {
        try {
          assert(() => url === 'http://127.0.0.1:3475/')
          done()
        } catch (e) {
          done(e)
        }
      })
  })

  it('allocates https server', done => {
    read('/folder/reserve-with-another-port.json')
      .then(configuration => {
        serve(configuration)
          .on('error', parameters => done(parameters.error))
          .on('ready', ({ url }) => {
            try {
              assert(() => url === 'https://127.0.0.1:220103/')
              done()
            } catch (e) {
              done(e)
            }
          })
      })
      .catch(done)
  })
})
