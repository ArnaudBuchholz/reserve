'use strict'

const assert = require('./assert')
const interpolate = require('../../interpolate')

function compare (result, expected) {
  const keys = Object.keys(expected)
  assert(() => keys.length === Object.keys(result).length)
  keys.forEach(key => {
    const expectedValue = expected[key]
    const value = result[key]
    if (typeof expectedValue === 'object') {
      compare(value, expectedValue)
    } else {
      assert(() => expectedValue === value)
    }
  })
}

const match = [0, 'a', 'b']

describe('interpolate', () => {
  describe('string', () => {
    it('substitutes capturing groups', () => {
      assert(() => interpolate(match, '$1$2') === 'ab')
    })

    it('ignores non captured groups', () => {
      assert(() => interpolate(match, '$1$3$2') === 'ab')
    })

    it('substitutes all occurrences of capturing groups', () => {
      assert(() => interpolate(match, '$1$2$1$2') === 'abab')
    })

    it('unescapes $$', () => {
      assert(() => interpolate(match, '$1$$$2') === 'a$b')
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
