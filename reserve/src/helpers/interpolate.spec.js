'use strict'

const { describe, it } = require('mocha')
const assert = require('assert')
const interpolate = require('./interpolate')

describe('helpers/interpolate', () => {
  describe('string', () => {
    it('substitutes capturing groups', () => {
      assert.strictEqual(interpolate([0, 'a', 'b'], '$1$2'), 'ab')
    })

    it('ignores non captured groups', () => {
      assert.strictEqual(interpolate([0, 'a', 'b'], '$1$99$2'), 'ab')
    })

    it('substitutes all occurrences of capturing groups', () => {
      assert.strictEqual(interpolate([0, 'a', 'b'], '$1$2$1$2'), 'abab')
    })

    it('substitutes all occurrences of named capturing groups', () => {
      assert.strictEqual(interpolate({ groups: { id: 'a' } }, '$id$id'), 'aa')
    })

    it('unescapes $$', () => {
      assert.strictEqual(interpolate([0, 'a', 'b'], '$1$$$2'), 'a$b')
    })
  })

  describe('object', () => {
    it('interpolates properties', () => {
      assert.deepStrictEqual(interpolate([0, 'a', 'b'], {
        a: '<$1>',
        b: '$$$2',
        string: 'string',
        number: 0,
        boolean: true
      }), {
        a: '<a>',
        b: '$b',
        string: 'string',
        number: 0,
        boolean: true
      })
    })

    it('interpolates recursively', () => {
      assert.deepStrictEqual(interpolate([0, 'a', 'b'], {
        c: {
          a: '<$1>',
          b: '$$$2'
        }
      }), {
        c: {
          a: '<a>',
          b: '$b'
        }
      })
    })
  })
})
