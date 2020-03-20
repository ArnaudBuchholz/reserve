'use strict'

const assert = require('./assert')
const interpolate = require('../../interpolate')

describe('interpolate', () => {
  describe('string', () => {
    it('substitutes capturing groups', () => {
      assert(() => interpolate([undefined, 'a', 'b'], '$1$2') === 'ab')
    })

    it('substitutes all occurrences of capturing groups', () => {
      assert(() => interpolate([undefined, 'a', 'b'], '$1$2$1$2') === 'abab')
    })

    it('unescapes $$', () => {
      assert(() => interpolate([undefined, 'a', 'b'], '$1$$$2') === 'a$b')
    })
  })
})
