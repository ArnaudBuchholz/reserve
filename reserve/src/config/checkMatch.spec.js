'use strict'
const { describe, it, before } = require('mocha')
const assert = require('assert')
const checkMatch = require('./checkMatch')
const { $mappingMatch } = require('../symbols')

async function test (label, mapping, matches) {
  describe(label, () => {
    before(() => {
      checkMatch(mapping)
      assert.strictEqual(typeof mapping[$mappingMatch], 'function')
    })

    for (const { url, method, captured: expectedCaptured, named: expectedNamed } of matches) {
      if (expectedCaptured === undefined) {
        it(`ignores ${method} ${url}`, async () => {
          const match = await mapping[$mappingMatch](url, method)
          assert.strictEqual(match, null)
        })
      } else {
        it(`matches ${method} ${url}`, async () => {
          const match = await mapping[$mappingMatch](url, method)
          const [, ...captured] = match
          assert.deepEqual(captured, expectedCaptured)
          const { groups } = match
          assert.deepEqual(groups, expectedNamed)
        })
      }
    }
  })
}

describe('config/checkMatch', () => {
  test('no settings',
    {
    },
    [{
      url: '/any',
      method: 'GET',
      captured: ['/any'] // everything is captured
    }]
  )

  test('url matching',
    {
      match: '/any'
    },
    [{
      url: '/any',
      method: 'GET',
      captured: ['']
    }, {
      url: '/any?params',
      method: 'POST',
      captured: ['?params']
    }, {
      url: '/nope',
      method: 'GET'
    }]
  )
})
