'use strict'

const { describe, it } = require('mocha')
const assert = require('assert')
const interpolate = require('./interpolate')

function compare (result, expected) {
  const keys = Object.keys(expected)
  assert.strictEqual(keys.length, Object.keys(result).length)
  keys.forEach(key => {
    const expectedValue = expected[key]
    const value = result[key]
    if (typeof expectedValue === 'object') {
      compare(value, expectedValue)
    } else {
      assert.strictEqual(expectedValue, value)
    }
  })
}

const match = [0, 'a', 'b', '%26', '%20']

describe('interpolate', () => {
  describe('string', () => {
    it('substitutes capturing groups', () => {
      assert.strictEqual(interpolate(match, '$1$2'), 'ab')
    })

    it('ignores non captured groups', () => {
      assert.strictEqual(interpolate(match, '$1$99$2'), 'ab')
    })

    it('substitutes all occurrences of capturing groups', () => {
      assert.strictEqual(interpolate(match, '$1$2$1$2'), 'abab')
    })

    it('unescapes $$', () => {
      assert.strictEqual(interpolate(match, '$1$$$2'), 'a$b')
    })

    describe('decoding capturing groups', () => {
      it('decodes with decodeURI ($&3)', () => {
        assert.strictEqual(interpolate(match, '$&1$&2$&3$&4'), 'ab%26 ')
      })

      it('decodes with decodeURIComponent ($%3)', () => {
        assert.strictEqual(interpolate(match, '$%1$%2$%3$%4'), 'ab& ')
      })
    })
  })

  describe('object', () => {
    it('interpolates properties', () => {
      compare(interpolate(match, {
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
      compare(interpolate(match, {
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
