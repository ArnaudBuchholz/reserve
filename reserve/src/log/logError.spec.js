'use strict'

const { describe, it, beforeEach } = require('mocha')
const assert = require('assert')
const { console: { clean, collect } } = require('test-tools')
const logError = require('./logError')

describe('log/logError', () => {
  beforeEach(clean)

  it('logs errors non related to requests', () => {
    logError({
      reason: 'REASON',
      id: 3475 // hex is 0D93
    })
    const output = collect()
    assert.strictEqual(output.length, 1)
    assert.strictEqual(output[0].type, 'error')
    assert.ok(output[0].text.includes('REASON'))
    assert.ok(!output[0].text.includes('3475'))
    assert.ok(!output[0].text.includes('D93'))
  })
})
