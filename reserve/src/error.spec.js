'use strict'

const { describe, it } = require('mocha')
const assert = require('assert')
const { throwError, newError, ERROR_EVENT_UNKNOWN_NAME, ERROR_SERVE_PORT_ALREADY_USED, ERROR_CONFIG_INVALID_HANDLER } = require('./error')

describe('error', () => {
  it('builds a generic error', () => {
    const error = newError()
    assert.strictEqual(error.name, 'REserveError')
    assert.strictEqual(error.message, 'An error occurred')
    assert.strictEqual(error.code, -1)
  })

  it('builds an error', () => {
    const error = newError(ERROR_EVENT_UNKNOWN_NAME)
    assert.strictEqual(error.name, 'REserveError')
    assert.strictEqual(error.message, 'Unknown event name')
    assert.strictEqual(error.code, ERROR_EVENT_UNKNOWN_NAME)
  })

  it('throws an error', () => {
    assert.throws(() => throwError(ERROR_EVENT_UNKNOWN_NAME))
  })

  it('builds a message with parameters (integer value)', () => {
    const error = newError(ERROR_SERVE_PORT_ALREADY_USED, { port: 8081 })
    assert.strictEqual(error.message, 'Configured port 8081 already in use')
  })

  it('builds a message with parameters (string value)', () => {
    const error = newError(ERROR_CONFIG_INVALID_HANDLER, { type: 'test' })
    assert.strictEqual(error.message, 'Invalid "test" handler: redirect is not a function')
  })
})
