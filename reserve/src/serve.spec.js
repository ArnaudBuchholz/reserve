'use strict'

const { describe, it } = require('mocha')
const assert = require('assert')
const serve = require('./serve')
const { read } = require('./config/configuration')
const http = require('http').__unmocked__

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
  }, ({ url, http2 }) => {
    assert.strictEqual(url, 'http://127.0.0.1:3475/')
    assert.strictEqual(http2, false)
  }))

  it('fails if port is already in use', () => new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/plain')
      res.end('Hello World\n')
    })
    server.listen(0, '127.0.0.1', (err) => {
      if (err) {
        reject(err)
      }
      const { port } = server.address()
      resolve(
        promisifyWithError({
          hostname: '127.0.0.1',
          port
        }, reason => {
          assert.strictEqual(reason.message, `Configured port ${port} already in use`)
        })
          .then(() => server.close(), reason => {
            server.close()
            throw reason
          })
      )
    })
  }))

  it('allocates a port', () => promisify({
    hostname: '127.0.0.1',
    port: 'auto'
  }, ({ url, http2 }) => {
    assert.strictEqual(url, 'http://127.0.0.1:34750/')
    assert.strictEqual(http2, false)
  }))

  it('allocates https server', () => read('/folder/reserve-with-another-port.json')
    .then(configuration => promisify(configuration, ({ url, http2 }) => {
      assert.strictEqual(url, 'https://192.168.0.1:8080/')
      assert.strictEqual(http2, false)
    }))
  )

  it('allocates unsecured http2 server', () => read('/reserve.json')
    .then(configuration => promisify({ ...configuration, http2: true }, ({ url, http2 }) => {
      assert.strictEqual(url, 'http://192.168.0.1:3475/')
      assert.strictEqual(http2, true)
    }))
  )

  it('allocates secured http2 server', () => read('/folder/reserve-with-another-port.json')
    .then(configuration => promisify({ ...configuration, http2: true }, ({ url, http2 }) => {
      assert.strictEqual(url, 'https://192.168.0.1:8080/')
      assert.strictEqual(http2, true)
    }))
  )

  it('transmits server creation error', () => promisifyWithError({
    hostname: 'error'
  }, reason => {
    assert.strictEqual(reason.message, 'error')
  }))

  describe('listeners', () => {
    it('fails if a listener registration throws an exception', () => promisifyWithError({
      listeners: [eventEmitter => {
        throw new Error('immediate')
      }],
      hostname: '127.0.0.1',
      port: 3475
    }, reason => {
      assert.strictEqual(reason.message, 'immediate')
    }))

    it('fails if a listener throws an exception during created', () => promisifyWithError({
      listeners: [eventEmitter => {
        eventEmitter.on('created', () => {
          throw new Error('created')
        })
      }],
      hostname: '127.0.0.1',
      port: 3475
    }, reason => {
      assert.strictEqual(reason.message, 'created')
    }))

    it('provides server instance to listeners (created)', () => promisify({
      listeners: [eventEmitter => {
        eventEmitter.on('created', ({ server }) => {
          assert.ok(!!server)
        })
      }],
      hostname: '127.0.0.1',
      port: 3475
    }, ({ url }) => {
      assert.strictEqual(url, 'http://127.0.0.1:3475/')
    }))
  })

  describe('close', () => {
    it('terminates the server', async () => {
      let httpServer
      const server = serve({
        listeners: [eventEmitter => {
          eventEmitter.on('created', ({ server }) => {
            httpServer = server
          })
        }],
        hostname: '127.0.0.1',
        port: 3475
      })
      await new Promise(resolve => server.on('ready', resolve))
      await server.close()
      assert.ok(httpServer._closed)
    })

    it('ignores the error', async () => {
      const server = serve({
        hostname: 'error'
      })
      let errorThrown
      try {
        await new Promise((resolve, reject) => server
          .on('ready', resolve)
          .on('error', reject)
        )
      } catch (e) {
        errorThrown = e
      }
      assert.ok(errorThrown !== undefined)
      await server.close()
    })
  })
})
