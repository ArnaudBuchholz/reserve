'use strict'

const assert = require('./assert')
const checkMethod = require('../../checkMethod')

function test (method, expected) {
  return () => {
    const object = { method }
    checkMethod(object, 'checked')
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
  it('ignores undefined method', test(undefined, undefined))
  it('validates string method', test('post', ['POST']))
  it('validates string methods', test('get,post', ['GET', 'POST']))
})
