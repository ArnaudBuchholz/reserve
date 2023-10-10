'use strict'

const { assert } = require('test-tools')
const headersFactory = require('./headers')

describe('mock/headers', () => {
  it('returns an empty object', () => {
    const headers = headersFactory()
    assert(() => Object.keys(headers).length === 0)
  })

  it('returns an initialized object', () => {
    const headers = headersFactory({
      'Content-Length': 2
    })
    assert(() => Object.keys(headers).length === 1)
    assert(() => headers['Content-Length'] === 2)
  })

  it('lowercases properties (get)', () => {
    const headers = headersFactory({
      'Content-Length': 2
    })
    assert(() => headers['content-length'] === 2)
  })

  it('lowercases properties (set)', () => {
    const headers = headersFactory({
      'Content-Length': 2
    })
    assert(() => headers['content-length'] === 2)
  })

  it('supports number keys (get)', () => {
    const headers = headersFactory({
      1: 'OK'
    })
    assert(() => headers[1] === 'OK')
  })

  it('supports number keys (set)', () => {
    const headers = headersFactory({})
    headers[1] = 'OK'
    assert(() => headers['1'] === 'OK')
  })

  it('supports Symbol keys (get)', () => {
    const key = Symbol('key')
    const headers = headersFactory({
      [key]: 'OK'
    })
    assert(() => headers[key] === 'OK')
  })

  it('supports Sumbol keys (set)', () => {
    const headers = headersFactory({})
    const key = Symbol('key')
    headers[key] = 'OK'
    assert(() => headers[key] === 'OK')
  })
})
