'use strict'

const assert = require('./assert')

describe('index', () => {
  it('returns all APIs when required', () => {
    const apis = require('../../.')
    assert(() => typeof apis.check === 'function')
    assert(() => typeof apis.log === 'function')
    assert(() => typeof apis.mock === 'function')
    assert(() => typeof apis.read === 'function')
    assert(() => typeof apis.serve === 'function')
  })
})
