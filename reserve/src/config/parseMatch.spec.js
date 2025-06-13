'use strict'
const { describe, it } = require('mocha')
const assert = require('assert')
const parseMatch = require('./parseMatch')

describe('config/parseMatch', () => {
  const invalidValues = {
    false: false,
    true: true,
    0: 0,
    '-1': -1,
    1: 1,
    'function () {}': function () {},
    'Symbol(\'test\')': Symbol('test'),
    '{}': {}
  }
  Object.keys(invalidValues).forEach(label => {
    const invalidValue = invalidValues[label]
    it(`rejects invalid values (${label})`, () => {
      assert.throws(() => parseMatch(invalidValue))
    })
  })

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

  describe('string definition', () => {
    describe('looks like a regex', () => {
      it('contains a capturing group', () => {
        const re = parseMatch('(.*)')
        assert.ok(re instanceof RegExp)
        assert.strictEqual(re.toString(), '/(.*)/')
      })

      it('contains the startsWith operator (anywhere)', () => {
        const re = parseMatch('^/test')
        assert.ok(re instanceof RegExp)
        assert.strictEqual(re.toString(), '/^\\/test/')
      })

      it('contains the endsWith operator (anywhere)', () => {
        const re = parseMatch('test$')
        assert.ok(re instanceof RegExp)
        assert.strictEqual(re.toString(), '/test$/')
      })

      it('contains the character range operator', () => {
        const re = parseMatch('[a-z]')
        assert.ok(re instanceof RegExp)
        assert.strictEqual(re.toString(), '/[a-z]/')
      })

      it('contains the alternate operator', () => {
        const re = parseMatch('a|b')
        assert.ok(re instanceof RegExp)
        assert.strictEqual(re.toString(), '/a|b/')
      })

      it('contains the escape character', () => {
        const re = parseMatch('\\d')
        assert.ok(re instanceof RegExp)
        assert.strictEqual(re.toString(), '/\\d/')
      })

      it('contains the optional operator (?)', () => {
        const re = parseMatch('a?')
        assert.ok(re instanceof RegExp)
        assert.strictEqual(re.toString(), '/a?/')
      })

      it('contains the multiplicity operator (+)', () => {
        const re = parseMatch('a+')
        assert.ok(re instanceof RegExp)
        assert.strictEqual(re.toString(), '/a+/')
      })

      it('contains the multiplicity operator (*)', () => {
        const re = parseMatch('a*')
        assert.ok(re instanceof RegExp)
        assert.strictEqual(re.toString(), '/a*/')
      })

      it('contains the multiplicity operator ({})', () => {
        const re = parseMatch('a{3,}')
        assert.ok(re instanceof RegExp)
        assert.strictEqual(re.toString(), '/a{3,}/')
      })

      it('keeps the regular expression as-is', () => {
        const re = parseMatch('/a*')
        assert.ok(re instanceof RegExp)
        assert.strictEqual(re.toString(), '/\\/a*/')
      })
    })

    describe('otherwise a pattern', () => {
      it('converts to regex (root)', () => {
        const re = parseMatch('/')
        assert.ok(re instanceof RegExp)
        assert.strictEqual(re.toString(), '/^\\/(.*)/')
      })

      it('converts to regex (no dot)', () => {
        const re = parseMatch('/path')
        assert.ok(re instanceof RegExp)
        assert.strictEqual(re.toString(), '/^\\/path\\b(.*)/')
      })

      it('converts to regex (ending slash)', () => {
        const re = parseMatch('/path/')
        assert.ok(re instanceof RegExp)
        assert.strictEqual(re.toString(), '/^\\/path\\/(.*)/')
      })

      it('converts to regex (with dot)', () => {
        const re = parseMatch('/name.extension')
        assert.ok(re instanceof RegExp)
        assert.strictEqual(re.toString(), '/^\\/name\\.extension\\b(.*)/')
      })

      it('handles query parameters (:)', () => {
        const re = parseMatch('/books/:id')
        assert.ok(re instanceof RegExp)
        assert.strictEqual(re.toString(), '/^\\/books\\/(?<id>[^/]*)\\b(.*)/')
      })

      it('handles query parameter (:) in the middle of the url', () => {
        const re = parseMatch('/books/:id/rentals')
        assert.ok(re instanceof RegExp)
        assert.strictEqual(re.toString(), '/^\\/books\\/(?<id>[^/]*)\\/rentals\\b(.*)/')
      })

      it('handles query parameter (:) in the middle of the url (and ending slash)', () => {
        const re = parseMatch('/books/:id/rentals/')
        assert.ok(re instanceof RegExp)
        assert.strictEqual(re.toString(), '/^\\/books\\/(?<id>[^/]*)\\/rentals\\/(.*)/')
      })
    })
  })
})
