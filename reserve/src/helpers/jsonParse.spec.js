'use strict'

const { describe, it } = require('mocha')
const assert = require('assert')
const jsonParse = require('./jsonParse')

describe('helpers/jsonParse', () => {
  it('parses valid JSON', () => {
    assert.deepStrictEqual(jsonParse('{"a":1,"b":"hello"}'), { a: 1, b: 'hello' })
  })

  it('parses arrays', () => {
    assert.deepStrictEqual(jsonParse('[1,2,3]'), [1, 2, 3])
  })

  it('parses nested objects', () => {
    assert.deepStrictEqual(jsonParse('{"a":{"b":2}}'), { a: { b: 2 } })
  })

  it('throws on invalid JSON', () => {
    assert.throws(() => jsonParse('not json'), SyntaxError)
  })

  it('drops __proto__ key', () => {
    const result = jsonParse('{"__proto__":{"polluted":true},"safe":1}')
    assert.strictEqual(result.safe, 1)
    assert.strictEqual(Object.keys(result).includes('__proto__'), false)
    assert.strictEqual(result.polluted, undefined)
  })

  it('drops constructor key', () => {
    const result = jsonParse('{"constructor":{"polluted":true},"safe":1}')
    assert.strictEqual(result.safe, 1)
    assert.strictEqual(result.constructor, Object)
  })

  it('drops nested __proto__ key', () => {
    const result = jsonParse('{"a":{"__proto__":{"polluted":true},"b":2}}')
    assert.strictEqual(result.a.b, 2)
    assert.strictEqual(result.a.polluted, undefined)
    assert.strictEqual(Object.keys(result.a).includes('__proto__'), false)
  })
})
