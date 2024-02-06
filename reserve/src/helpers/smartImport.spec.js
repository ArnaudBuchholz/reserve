'use strict'

const { describe, it } = require('mocha')
const smartImport = require('./smartImport')
const assert = require('assert')
const { join } = require('path')

const base = join(__dirname, '../../tests')

describe('smartImport', () => {
  it('imports CommonJS file if ending with .cjs', async () => {
    const func = await smartImport(join(base, 'import.cjs'))
    assert.strictEqual(typeof func, 'function')
    assert.strictEqual(func(), 'cjs:OK')
  })

  it('imports ESM file if ending with .mjs', async () => {
    const func = await smartImport(join(base, 'import.mjs'))
    assert.strictEqual(typeof func, 'function')
    assert.strictEqual(func(), 'esm:OK')
  })
})
