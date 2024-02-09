'use strict'
const { describe, it } = require('mocha')
const assert = require('assert')
const parseMatch = require('./parseMatch')

describe('config/parseMatch', () => {
  it('keeps regular expression', () => {
    const re = /whatever/
    assert.strictEqual(parseMatch(re), re)
  })

  it('supports { re: "..." } syntax for configuration files', () => {
    const re = parseMatch({ re: 'whatever' })
    assert.ok(re instanceof RegExp)
    assert.strictEqual('a whatever b'.replace(re, 'o'), 'a o b')
  })

  it('supports { re: "...", flags: "..." } syntax for configuration files', () => {
    const re = parseMatch({ re: 'a', flags: 'g' })
    assert.ok(re instanceof RegExp)
    assert.strictEqual('a whatever b'.replace(re, 'o'), 'o whotever b')
  })
})
