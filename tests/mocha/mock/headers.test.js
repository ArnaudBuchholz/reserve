'use strict'

const assert = require('../assert')
const headersFactory = require('../../../mock/headers')

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
})
