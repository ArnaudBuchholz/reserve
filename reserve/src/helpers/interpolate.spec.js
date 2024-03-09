'use strict'

const { describe, it } = require('mocha')
const assert = require('assert')
const interpolate = require('./interpolate')

describe('helpers/interpolate', () => {
  describe('string', () => {
    describe('capturing groups', () => {
      it('substitutes captured values', () => {
        assert.strictEqual(interpolate([0, 'a', 'b'], '$1$2'), 'ab')
      })

      it('ignores missing values', () => {
        assert.strictEqual(interpolate([0, 'a', 'b'], '$1$99$2'), 'ab')
      })

      it('substitutes all occurrences', () => {
        assert.strictEqual(interpolate([0, 'a', 'b'], '$1$2$1$2'), 'abab')
      })
    })

    describe('named capturing groups', () => {
      it('substitutes captured values', () => {
        assert.strictEqual(interpolate({ groups: { id: '-' } }, 'before&$id&after'), 'before&-&after')
      })

      it('ignores missing values', () => {
        assert.strictEqual(interpolate({ groups: {} }, '$id'), '')
      })

      it('ignores missing values (no named capturing groups)', () => {
        assert.strictEqual(interpolate([], '$id'), '')
      })

      it('substitutes all occurrences', () => {
        assert.strictEqual(interpolate({ groups: { id: 'a' } }, '$id$id'), 'aa')
      })
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
