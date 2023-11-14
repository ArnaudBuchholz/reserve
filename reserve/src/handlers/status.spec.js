'use strict'

const assert = require('assert')
const { wrapHandler } = require('test-tools')
const statusHandler = require('./status')
const handle = wrapHandler(statusHandler)

const textMimeType = 'text/plain'

describe('handlers/status', () => {
  it('returns a promise', () => handle({
    mapping: null,
    redirect: 404
  })
    .then(({ promise }) => {
      assert.strictEqual(typeof promise.then, 'function')
    })
  )

  it('sends a generic response for known codes', () => handle({
    mapping: null,
    redirect: 404
  })
    .then(({ promise, response }) => promise.then(value => {
      assert.strictEqual(value, undefined)
      assert.strictEqual(response.statusCode, 404)
      assert.strictEqual(response.headers['Content-Type'], textMimeType)
      assert.strictEqual(response.toString(), 'Not found')
    }))
  )

  it('sends an empty response for unknonw codes', () => handle({
    mapping: null,
    redirect: 418
  })
    .then(({ promise, response }) => promise.then(value => {
      assert.strictEqual(value, undefined)
      assert.strictEqual(response.statusCode, 418)
      assert.strictEqual(response.headers['Content-Type'], textMimeType)
      assert.strictEqual(response.toString(), '')
    }))
  )

  it('can be used for redirections', () => handle({
    mapping: {
      status: 302,
      headers: {
        Location: '$1'
      }
    },
    redirect: 302,
    match: [undefined, 'https://www.npmjs.com/package/reserve']
  })
    .then(({ promise, response }) => promise.then(value => {
      assert.strictEqual(value, undefined)
      assert.strictEqual(response.statusCode, 302)
      assert.strictEqual(response.headers['Content-Type'], textMimeType)
      assert.strictEqual(response.toString(), '')
      assert.strictEqual(response.headers.Location, 'https://www.npmjs.com/package/reserve')
    }))
  )
})
