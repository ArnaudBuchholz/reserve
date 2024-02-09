'use strict'

const { describe, it } = require('mocha')
const assert = require('assert')
const { notExpected } = require('test-tools')
const body = require('./body')
const { Readable } = require('stream')

function request (chunks, headers) {
  function * data () {
    for (const chunk of chunks) {
      if (chunk instanceof Error) {
        throw chunk
      } else if (typeof chunk === 'string') {
        yield Buffer.from(chunk)
      } else {
        yield chunk
      }
    }
  }
  const stream = Readable.from(data())
  stream.headers = headers
  return stream
}

describe('helpers/body', () => {
  describe('without headers', () => {
    it('deserializes the request body', async () => body(request([
      'Hello',
      ' World',
      ' !'
    ]))
      .then(buffer => {
        assert.ok(buffer instanceof Buffer)
        assert.strictEqual(Buffer.compare(buffer, Buffer.from('Hello World !')), 0)
      }, notExpected)
    )

    it('deserializes the request body as buffer', async () => body(request([
      'Hello',
      ' World',
      ' !'
    ])).buffer()
      .then(buffer => {
        assert.ok(buffer instanceof Buffer)
        assert.strictEqual(Buffer.compare(buffer, Buffer.from('Hello World !')), 0)
      }, notExpected)
    )

    it('deserializes the request body as text', async () => body(request([
      'Hello',
      ' World',
      ' !'
    ])).text()
      .then(text => assert.strictEqual(text, 'Hello World !'), notExpected)
    )

    it('deserializes the request body as json', async () => body(request([
      '{',
      '"hello"',
      ':',
      '"World !"',
      '}'
    ])).json()
      .then(json => assert.deepStrictEqual(json, { hello: 'World !' }), notExpected)
    )
  })

  describe('content-length', () => {
    it('allocates the buffer once', async () => body(request([
      'Hello',
      ' World',
      ' !'
    ], {
      'content-length': '13'
    })).text()
      .then(text => assert.strictEqual(text, 'Hello World !'), notExpected)
    )

    it('allocates the buffer once and limit the content', async () => body(request([
      'Hello',
      ' World',
      ' !'
    ], {
      'content-length': '5'
    })).text()
      .then(text => assert.strictEqual(text, 'Hello'), notExpected)
    )

    it('allocates the buffer once and initialize it', async () => body(request([
      'Hello',
      ' World',
      ' !'
    ], {
      'content-length': '20'
    })).text()
      .then(text => assert.strictEqual(text, 'Hello World !\x00\x00\x00\x00\x00\x00\x00'), notExpected)
    )

    it('may ignore content-length if requested', async () => body(request([
      'Hello',
      ' World',
      ' !'
    ], {
      'content-length': '5'
    }), {
      ignoreContentLength: true
    }).text()
      .then(text => assert.strictEqual(text, 'Hello World !'), notExpected)
    )
  })

  describe('content-type', () => {
    it('returns text if text/plain', async () => body(request([
      '{',
      '"hello"',
      ':',
      '"World !"',
      '}'
    ], {
      'content-type': 'text/plain'
    }))
      .then(text => assert.strictEqual(text, '{"hello":"World !"}'), notExpected)
    )

    it('can be overridden using .json() if text/plain', async () => body(request([
      '{',
      '"hello"',
      ':',
      '"World !"',
      '}'
    ], {
      'content-type': 'text/plain'
    })).json()
      .then(json => assert.deepStrictEqual(json, { hello: 'World !' }), notExpected)
    )

    it('returns json if application/json', async () => body(request([
      '{',
      '"hello"',
      ':',
      '"World !"',
      '}'
    ], {
      'content-type': 'application/json'
    }))
      .then(json => assert.deepStrictEqual(json, { hello: 'World !' }), notExpected)
    )

    it('can be overridden using .text() if application/json', async () => body(request([
      '{',
      '"hello"',
      ':',
      '"World !"',
      '}'
    ], {
      'content-type': 'application/json'
    })).text()
      .then(text => assert.strictEqual(text, '{"hello":"World !"}'), notExpected)
    )

    it('returns a buffer otherwise', async () => body(request([
      '<xml/>'
    ], {
      'content-type': 'application/xml'
    }))
      .then(buffer => {
        assert.ok(buffer instanceof Buffer)
        assert.strictEqual(Buffer.compare(buffer, Buffer.from('<xml/>')), 0)
      }, notExpected)
    )

    it('can be overridden using .text() otherwise', async () => body(request([
      '<xml/>'
    ], {
      'content-type': 'application/xml'
    })).text()
      .then(text => assert.strictEqual(text, '<xml/>'), notExpected)
    )
  })

  it('forwards the error', async () => body(request([
    'Hello',
    ' World',
    new Error('fail')
  ]))
    .then(notExpected, reason => assert.strictEqual(reason.message, 'fail'))
  )
})
