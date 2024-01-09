'use strict'

const assert = require('assert')
const { Readable } = require('stream')
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

  it('handles ReadableStream (application/octet-stream)', async () => {
    function * data () {
      yield 'Hello'
      yield ' '
      yield 'World'
      yield ' '
      yield '!'
    }
    const readableStream = Readable.from(data(), { encoding: 'utf8' })
    await send(response, readableStream)
    assert.strictEqual(response.statusCode, 200)
    assert.deepStrictEqual(response.toString(), 'Hello World !')
    assert.strictEqual(response.headers['content-type'], 'application/octet-stream')
  })

  it('handles ReadableStream error and end response', async () => {
    const error = new Error('Nope')
    function * data () {
      yield 'Hello'
      yield ' '
      throw error
    }
    const readableStream = Readable.from(data(), { encoding: 'utf8' })
    let failed = false
    try {
      await send(response, readableStream)
    } catch (e) {
      failed = true
      assert.strictEqual(e, error)
    }
    assert.strictEqual(failed, true)
    assert.strictEqual(response.statusCode, 200)
    assert.deepStrictEqual(response.toString(), 'Hello ')
    assert.strictEqual(response.ended, true)
  })

  it('handles undefined', async () => {
    await send(response, undefined)
    assert.strictEqual(response.statusCode, 200)
    assert.deepStrictEqual(response.toString(), '')
    assert.strictEqual(response.headers['content-type'], undefined)
  })

  it('handles undefined with options', async () => {
    await send(response, undefined, {
      statusCode: 204,
      noBody: true
    })
    assert.strictEqual(response.statusCode, 204)
    assert.deepStrictEqual(response.toString(), '')
    assert.strictEqual(response.headers['content-type'], undefined)
  })

  it('handles ReadableStream (stream error)', async () => {
    function * data () {
      yield 'Hello'
      yield ' '
      yield 'World'
      throw new Error()
    }
    const readableStream = Readable.from(data(), { encoding: 'utf8' })
    let exceptionCaught
    try {
      await send(response, readableStream)
    } catch (e) {
      exceptionCaught = e
    }
    assert.ok(!!exceptionCaught)
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

  it('does not override content-type if defined in headers', async () => {
    await send(response, 'Hello World !', {
      headers: {
        'content-type': 'abc'
      }
    })
    assert.strictEqual(response.statusCode, 200)
    assert.strictEqual(response.toString(), 'Hello World !')
    assert.strictEqual(response.headers['content-type'], 'abc')
  })

  it('does not override content-length if defined in headers', async () => {
    await send(response, 'Hello World !', {
      headers: {
        'content-length': '123'
      }
    })
    assert.strictEqual(response.statusCode, 200)
    assert.strictEqual(response.toString(), 'Hello World !')
    assert.strictEqual(response.headers['content-length'], '123')
  })

  it('prevents sending data (to process HEAD requests)', async () => {
    await send(response, 'Hello World !', {
      noBody: true
    })
    assert.strictEqual(response.statusCode, 200)
    assert.strictEqual(response.toString(), '')
    assert.strictEqual(response.headers['content-type'], 'text/plain')
    assert.strictEqual(response.headers['content-length'], '13')
  })
})
