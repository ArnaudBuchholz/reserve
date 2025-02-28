'use strict'

const { describe, it } = require('mocha')
const assert = require('assert')
const { notExpected, wrapHandler } = require('test-tools')
const customHandler = require('./custom')

const textMimeType = 'text/plain'

const handle = wrapHandler(customHandler, {
  mapping: {
    custom: () => {}
  }
})

describe('handlers/custom', () => {
  it('validates the custom function', async () => {
    let exceptionCaught
    try {
      await customHandler.validate({
        custom: false
      })
    } catch (e) {
      exceptionCaught = e
    }
    assert.ok(!!exceptionCaught)
  })

  it('does not return a promise if the custom function is sync', () => handle({
    request: '/any',
    mapping: {
      custom: function () {}
    }
  })
    .then(({ redirected }) => {
      assert.strictEqual(redirected, undefined)
    })
  )

  it('returns a promise if the custom function is async', () => handle({
    request: '/any',
    mapping: {
      custom: async function () {}
    }
  })
    .then(({ redirected }) => {
      assert.strictEqual(typeof redirected.then, 'function')
    })
  )

  it('calls the function with the proper parameters', () => handle({
    request: '/any',
    match: ['capturing groups are: ', 'first', 'second'],
    mapping: {
      custom: async function () {
        return arguments
      }
    }
  })
    .then(({ redirected, request, response }) => redirected.then(args => {
      assert.strictEqual(args.length, 4)
      assert.strictEqual(args[0], request)
      assert.strictEqual(args[1], response)
      assert.strictEqual(args[2], 'first')
      assert.strictEqual(args[3], 'second')
    }))
  )

  it('waits for the function result if a promise', () => handle({
    request: '/any',
    mapping: {
      custom: async () => 'OK'
    }
  })
    .then(({ redirected }) => redirected.then(value => {
      assert.strictEqual(value, 'OK')
    }))
  )

  it('lets any exception flow (will be intercepted by dispatcher)', () => handle({
    request: '/any',
    mapping: {
      custom: () => { throw new Error('KO') }
    }
  })
    .then(notExpected, reason => {
      assert.strictEqual(reason.message, 'KO')
    })
  )

  it('returns any rejected promise (will be intercepted by dispatcher)', () => handle({
    request: '/any',
    mapping: {
      custom: async () => { throw new Error('KO') }
    }
  })
    .then(({ redirected }) => redirected.then(notExpected, reason => {
      assert.strictEqual(reason.message, 'KO')
    }))
  )

  it('passes configuration on mapping if member not defined', () => handle({
    request: '/any',
    mapping: {
      custom: () => {}
    }
  })
    .then(({ mapping }) => assert.ok(mapping.configuration))
  )

  it('passes configuration on mapping even if defined', () => handle({
    request: '/any',
    mapping: {
      custom: () => {},
      configuration: false
    }
  })
    .then(({ mapping }) => assert.strictEqual(typeof mapping.configuration, 'object')))

  it('sends response when the result is an array (sync)', () => handle({
    request: '/any',
    mapping: {
      custom: () => ['Hello World!']
    }
  })
    .then(({ redirected, response }) => {
      assert.strictEqual(redirected, undefined)
      assert.strictEqual(response.statusCode, 200)
      assert.strictEqual(response.headers['Content-Type'], textMimeType)
      assert.strictEqual(response.toString(), 'Hello World!')
    })
  )

  it('sends response when the result is an array (async)', () => handle({
    request: '/any',
    mapping: {
      custom: async () => ['Hello World!']
    }
  })
    .then(({ redirected, response }) => redirected.then(value => {
      assert.strictEqual(value, undefined)
      assert.strictEqual(response.statusCode, 200)
      assert.strictEqual(response.headers['Content-Type'], textMimeType)
      assert.strictEqual(response.toString(), 'Hello World!')
    }))
  )

  it('enables the override of headers through options (second item of the array)', () => handle({
    request: '/any',
    mapping: {
      custom: async () => ['Hello World!', { statusCode: 204, headers: { 'x-test': 'true' } }]
    }
  })
    .then(({ redirected, response }) => redirected.then(value => {
      assert.strictEqual(value, undefined)
      assert.strictEqual(response.statusCode, 204)
      assert.strictEqual(response.headers['x-test'], 'true')
      assert.strictEqual(response.headers['Content-Type'], textMimeType)
      assert.strictEqual(response.toString(), 'Hello World!')
    }))
  )
})
