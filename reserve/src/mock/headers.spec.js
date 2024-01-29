'use strict'

const { describe, it } = require('mocha')
const assert = require('assert')
const headersFactory = require('./headers')

describe('mock/headers', () => {
  it('returns an empty object', () => {
    const headers = headersFactory()
    assert.strictEqual(Object.keys(headers).length, 0)
  })

  it('returns an initialized object', () => {
    const headers = headersFactory({
      'Content-Length': 2
    })
    assert.strictEqual(Object.keys(headers).length, 1)
    assert.strictEqual(headers['Content-Length'], '2')
  })

  it('lowercases properties (get)', () => {
    const headers = headersFactory({
      'Content-Length': 2
    })
    assert.strictEqual(headers['content-length'], '2')
  })

  it('lowercases properties (set)', () => {
    const headers = headersFactory({
      'Content-Length': 2
    })
    assert.strictEqual(headers['content-length'], '2')
  })

  it('supports number keys (get)', () => {
    const headers = headersFactory({
      1: 'OK'
    })
    assert.strictEqual(headers[1], 'OK')
  })

  it('supports number keys (set)', () => {
    const headers = headersFactory({})
    headers[1] = 'OK'
    assert.strictEqual(headers['1'], 'OK')
  })

  it('supports Symbol keys (get)', () => {
    const key = Symbol('key')
    const headers = headersFactory({
      [key]: 'OK'
    })
    assert.strictEqual(headers[key], 'OK')
  })

  it('supports Sumbol keys (set)', () => {
    const headers = headersFactory({})
    const key = Symbol('key')
    headers[key] = 'OK'
    assert.strictEqual(headers[key], 'OK')
  })
})
