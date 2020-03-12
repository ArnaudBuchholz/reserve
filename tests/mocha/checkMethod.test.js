'use strict'

const assert = require('./assert')
const checkMethod = require('../../checkMethod')

function test (method, expected, allowed) {
  return () => {
    if (allowed) {
        debugger
    }
    const object = { method }
    try {
      checkMethod(object, 'checked', allowed)
    } catch (e) {
      /* istanbul ignore else */ // That would be unexpected
      if (expected === Error) {
        return // Absorb error
      }
    }
    const result = object.checked
    if (expected) {
      assert(() => result.length === expected.length)
      expected.forEach((verb, index) => assert(() => result[index] === verb))
    } else {
      assert(() => !result)
    }
  }
}

describe('checkMethod', () => {
  describe('value validation', () => {
    it('ignores undefined', test(undefined, undefined))
    it('validates string', test('post', ['POST']))
    it('validates comma separated string', test('get,post', ['GET', 'POST']))
    it('validates array', test(['get' , 'post'], ['GET', 'POST']))
    it('invalidates function', test(test, Error))
    const invalidValues = [[], false, true, 0, 1, Symbol()]
    invalidValues.forEach(value => it(`invalidates ${JSON.stringify(value)}`, test(value, Error)))
  })

  describe('combine with allowed methods', () => {
    it('keeps allowed methods', test('get,post', ['GET', 'POST'], ['GET', 'POST']))
    it('filters out unallowed', test('get,post', ['GET'], ['GET']))
    it('fails if no more method left', test('post', Error, ['GET']))
  })
})
