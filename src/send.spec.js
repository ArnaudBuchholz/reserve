'use strict'

const assert = require('assert')
const send = require('./send')
const Response = require('./mock/Response')

describe('send', () => {
  let response

  beforeEach(() => {
    response = new Response()
  })

  it('handles text responses (text/plain)', async () => {
    await send(response, 'Hello World !')
    assert.strictEqual(response.statusCode, 200)
    assert.strictEqual(response.toString(), 'Hello World !')
    assert.strictEqual(response.headers['content-type'], 'text/plain')
    assert.strictEqual(response.headers['content-length'], '13')
  })

  it('stringify any object (application/json)', async () => {
    const object = { hello: 'World !' }
    await send(response, object)
    assert.strictEqual(response.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(response.toString()), object)
    assert.strictEqual(response.headers['content-type'], 'application/json')
    assert.strictEqual(response.headers['content-length'], '19')
  })

  it('enables statusCode override', async () => {
    await send(response, 'Not Found', {
      statusCode: 404
    })
    assert.strictEqual(response.statusCode, 404)
  })

  it('enables headers definition', async () => {
    await send(response, 'Redirect', {
      statusCode: 307,
      headers: {
        location: 'http://localhost/found'
      }
    })
    assert.strictEqual(response.statusCode, 307)
    assert.strictEqual(response.headers.location, 'http://localhost/found')
  })
})
