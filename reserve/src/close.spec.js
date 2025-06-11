'use strict'

const assert = require('assert')
const close = require('./close')
const { it, describe } = require('mocha')
const { $configurationRequests } = require('./symbols')

describe('close', () => {
  describe('no options provided', () => {
    it('does nothing', async () => {
      assert.doesNotThrow(() => close({}))
    })

    it('does not wait for active requests to finish i', async () => {
      const contexts = new Map([
        ['1', { holding: Promise.resolve().then(() => contexts.delete('1')) }],
        ['2', { holding: new Promise(resolve => setTimeout(resolve, 100)).then(() => contexts.delete('2')) }]
      ])
      const configuration = {
        [$configurationRequests]: {
          contexts
        }
      }
      await close(configuration, {})
      assert.notStrictEqual(configuration[$configurationRequests].contexts.size, 0)
    })
  })

  describe('with options.timeout', () => {
    it('waits for active requests to finish', async () => {
      const contexts = new Map([
        ['1', { holding: Promise.resolve().then(() => contexts.delete('1')) }],
        ['2', { holding: new Promise(resolve => setTimeout(resolve, 100)).then(() => contexts.delete('2')) }]
      ])
      const configuration = {
        [$configurationRequests]: {
          contexts
        }
      }
      await close(configuration, { timeout: 1000 })
      assert.strictEqual(configuration[$configurationRequests].contexts.size, 0)
    })

    it('waits for active requests to finish (but only until the timeout', async () => {
      const contexts = new Map([
        ['1', { holding: Promise.resolve().then(() => contexts.delete('1')) }],
        ['2', { holding: new Promise(() => {}) }]
      ])
      const configuration = {
        [$configurationRequests]: {
          contexts
        }
      }
      await close(configuration, { timeout: 100 })
      assert.strictEqual(configuration[$configurationRequests].contexts.size, 1)
    })
  })
})
