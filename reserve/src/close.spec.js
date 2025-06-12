'use strict'

const assert = require('assert')
const close = require('./close')
const { it, describe } = require('mocha')
const { $configurationRequests, $configurationClosed } = require('./symbols')

describe('close', () => {
  describe('no options provided', () => {
    it('sets closing flag', async () => {
      const configuration = {}
      await close(configuration)
      assert.strictEqual(configuration[$configurationClosed], true)
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

  describe('with options.close', () => {
    it('destroys all remaining requests', async () => {
      const allocContext = () => {
        const context = { request: { destroy: () => { context.destroyed = true } }, destroyed: false }
        return context
      }
      const context1 = allocContext()
      const context2 = allocContext()
      const contexts = new Map([
        ['1', context1],
        ['2', context2]
      ])
      const configuration = {
        [$configurationRequests]: {
          contexts
        }
      }
      await close(configuration, { force: true })
      assert.strictEqual(context1.destroyed, true)
      assert.strictEqual(context2.destroyed, true)
    })
  })
})
