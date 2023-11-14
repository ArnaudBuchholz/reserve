'use strict'

const assert = require('assert')

describe('index', () => {
  it('returns all APIs when required', () => {
    const apis = require('./index')
    assert.strictEqual(typeof apis.check, 'function')
    assert.strictEqual(typeof apis.log, 'function')
    assert.strictEqual(typeof apis.mock, 'function')
    assert.strictEqual(typeof apis.read, 'function')
    assert.strictEqual(typeof apis.serve, 'function')
  })
})
