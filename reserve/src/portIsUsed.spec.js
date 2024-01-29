'use strict'

const { describe, it } = require('mocha')
const assert = require('assert')
const checkPortStatus = require('./portIsUsed')
const http = require('node:http')

describe('checkPortIsUsed', () => {
  it('detects that the port is not used', async () => {
    assert.strictEqual(await checkPortStatus(80), false)
  })

  it('detects that the port is used', () => new Promise(resolve => {
    const server = http.createServer((req, res) => {
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/plain')
      res.end('Hello World\n')
    })
    server.listen(80, '127.0.0.1', async () => {
      assert.strictEqual(await checkPortStatus(80), true)
      server.close(resolve)
    })
  }))
})
