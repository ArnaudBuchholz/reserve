'use strict'
const { describe, it } = require('mocha')
const assert = require('assert')
const checkMatch = require('./checkMatch')
const { $mappingMatch } = require('../symbols')

describe('config/checkMatch', () => {
  it('supports no settings', () => {
    const mapping = {}
    checkMatch(mapping)
    assert.strictEqual(typeof mapping[$mappingMatch], 'function')
  })
})
