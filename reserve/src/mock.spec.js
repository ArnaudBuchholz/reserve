'use strict'

const { describe, it, before } = require('mocha')
const assert = require('assert')
const mock = require('./mock')
const { read } = require('./config/configuration')

function waitForReady (server) {
  return new Promise((resolve, reject) => {
    server
      .on('ready', () => {
        resolve(server)
      })
      .on('error', reject)
  })
}

describe('mock', () => {
  describe('keeping the original handlers', () => {
    let mocked

    before(() => read('/reserve.json')
      .then(configuration => waitForReady(mock(configuration)))
      .then(server => {
        mocked = server
      })
    )

    it('simulates a request and returns a response', () => mocked.request('GET', '/file.txt')
      .then(response => {
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.toString(), 'Hello World!')
      })
    )

    it('exposes the same interface', () => {
      assert.strictEqual(typeof mocked.close, 'function')
      assert.ok(mocked.close() instanceof Promise)
    })
  })

  describe('overriding the handlers', () => {
    let mocked

    before(() => read('/reserve.json')
      .then(configuration => waitForReady(mock(configuration, {
        file: {
          redirect: async ({ request, mapping, redirect, response }) => {
            if (redirect === '/') {
              response.writeHead(201, {
                'Content-Type': 'text/plain',
                'Content-Length': 5
              })
              response.flushHeaders()
              response.write('AB')
              response.write('CD')
              response.end('E')
            } else {
              return 500
            }
          }
        }
      })))
      .then(server => {
        mocked = server
      })
    )

    it('simulates a request and returns a response', () => mocked.request('GET', '/')
      .then(response => {
        assert.ok(response.headersSent)
        assert.strictEqual(response.statusCode, 201)
        assert.strictEqual(response.toString(), 'ABCDE')
      })
    )

    it('supports internal redirection', () => mocked.request('GET', '/error')
      .then(response => {
        assert.strictEqual(response.statusCode, 500)
      })
    )
  })

  describe('with listeners', () => {
    it('partly enables listeners', () => {
      const events = []
      return read('/reserve.json')
        .then(configuration => {
          configuration.listeners = [
            function register (eventEmitter) {
              eventEmitter.on('created', ({ configuration, server }) => {
                assert.ok(!!configuration)
                assert.strictEqual(server, null) // Can't have a server
                events.push('created')
              })
            }
          ]
          return waitForReady(mock(configuration))
        })
        .then(mocked => mocked.request('GET', '/file.txt'))
        .then(response => {
          assert.strictEqual(response.statusCode, 200)
          assert.strictEqual(response.toString(), 'Hello World!')
          assert.strictEqual(events.length, 1)
          assert.strictEqual(events[0], 'created')
        })
    })
  })

  describe('error handling', () => {
    it('signals initialization errors', () => {
      return assert.rejects(read('/reserve.json')
        .then(configuration => {
          configuration.listeners = [
            function register (eventEmitter) {
              throw new Error('KO')
            }
          ]
          return waitForReady(mock(configuration))
        })
      )
    })
  })

  describe('closing', () => {
    it('expose the close API', () => {
      return read('/reserve.json')
        .then(configuration => waitForReady(mock(configuration)))
        .then(async mocked => {
          await mocked.close()
          return mocked
        })
        .then(mocked => mocked.request('GET', '/file.txt'))
        .then(response => {
          assert.strictEqual(response.statusCode, 503)
          assert.strictEqual(response.toString(), 'Service Unavailable')
        })
    })
  })
})
