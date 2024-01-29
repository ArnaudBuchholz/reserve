'use strict'

const { describe, it } = require('mocha')
const assert = require('assert')
const portIsUsed = require('./portIsUsed')
const http = require('http').__unmocked__

describe('portIsUsed', () => {
  it('detects that the port is not used', async () => {
    assert.strictEqual(await portIsUsed(80), false)
  })

  it('detects that the port is used', () => new Promise((resolve, reject) => {
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
      setTimeout(async () => {
        try {
          assert.strictEqual(await portIsUsed(port), true)
          server.close(resolve)
        } catch (e) {
          reject(e)
        }
      }, 0)
    })
  }))
})
