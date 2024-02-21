'use strict'

const { describe, it } = require('mocha')
const assert = require('assert')
const defer = require('./defer')

describe('helpers/defer', () => {
  it('creates a promise and its associated functions (resolve)', async () => {
    const [promise, resolve] = defer()
    resolve('ok')
    assert.strictEqual(await promise, 'ok')
  })

  it('creates a promise and its associated functions (reject)', async () => {
    const [promise, , reject] = defer()
    reject('ko')
    assert.rejects(promise)
  })

  it('creates a promise', async () => {
    assert.strictEqual(await defer.$(resolve => resolve('ok')), 'ok')
  })
})
