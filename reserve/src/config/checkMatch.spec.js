'use strict'
const { describe, it, before } = require('mocha')
const assert = require('assert')
const checkMatch = require('./checkMatch')
const checkMethod = require('./checkMethod')
const { $mappingMatch, $mappingMethod } = require('../symbols')

async function test (label, mapping, matches) {
  describe(label, () => {
    let invertMatchMapping

    before(() => {
      checkMethod(mapping, $mappingMethod)
      checkMatch(mapping)
      assert.strictEqual(typeof mapping[$mappingMatch], 'function')

      if (mapping['if-match'] === undefined) {
        invertMatchMapping = { ...mapping, 'invert-match': true }
        checkMethod(invertMatchMapping, $mappingMethod)
        checkMatch(invertMatchMapping)
        assert.strictEqual(typeof invertMatchMapping[$mappingMatch], 'function')
      }
    })

    for (const { only, get, post, put, captured: expectedCaptured, named: expectedNamed } of matches) {
      let method, url
      if (get) {
        method = 'GET'
        url = get
      } else if (post) {
        method = 'POST'
        url = post
      } else if (put) {
        method = 'PUT'
        url = put
      } else {
        throw new Error('Unable to determine method and url')
      }
      const itMethod = only ? it.only : it
      if (expectedCaptured === undefined) {
        itMethod(`ignores ${method} ${url}`, async () => {
          const match = await mapping[$mappingMatch](url, { method })
          assert.ok(!match)
        })

        if (invertMatchMapping !== undefined) {
          itMethod(`matches ${method} ${url} (invert-match)`, async () => {
            const match = await invertMatchMapping[$mappingMatch](url, { method })
            assert.deepStrictEqual(match, [])
          })
        }
      } else {
        itMethod(`matches ${method} ${url}`, async () => {
          const match = await mapping[$mappingMatch](url, { method })
          if (expectedCaptured === true) {
            assert.strictEqual(match, true)
          } else {
            const [, ...captured] = match
            assert.deepStrictEqual(captured, expectedCaptured)
            const { groups } = match
            assert.deepStrictEqual(groups, expectedNamed)
          }
        })

        if (invertMatchMapping !== undefined) {
          itMethod(`ignores ${method} ${url}  (invert-match)`, async () => {
            const match = await invertMatchMapping[$mappingMatch](url, { method })
            assert.ok(!match)
          })
        }
      }
    }
  })
}

describe('config/checkMatch', () => {
  describe('validation', () => {
    describe('invert-match', () => {
      [0, 1, -1, '', 'true', false].forEach(invalidOptionValue =>
        it(`rejects ${JSON.stringify(invalidOptionValue)}`, () => {
          assert.throws(() => checkMatch({ 'invert-match': invalidOptionValue }))
        })
      )
    })

    describe('if-match', () => {
      [0, 1, -1, '', 'true', false].forEach(invalidOptionValue =>
        it(`rejects ${JSON.stringify(invalidOptionValue)}`, () => {
          assert.throws(() => checkMatch({ 'if-match': invalidOptionValue }))
        })
      )
    })
  })

  test('no settings',
    {
    },
    [{
      get: '/any',
      captured: ['/any'] // everything is captured
    }]
  )

  test('url matching',
    {
      match: '/any'
    },
    [{
      get: '/any',
      captured: ['']
    }, {
      post: '/any?params',
      captured: ['?params']
    }, {
      get: '/nope'
    }]
  )

  test('method matching',
    {
      method: 'GET'
    },
    [{
      get: '/any',
      captured: ['/any']
    }, {
      post: '/any?params'
    }]
  )

  test('methods matching (string)',
    {
      method: 'GET,POST'
    },
    [{
      get: '/any',
      captured: ['/any']
    }, {
      post: '/any?params',
      captured: ['/any?params']
    }, {
      put: '/any?params'
    }]
  )

  test('methods matching (array)',
    {
      method: ['GET', 'POST']
    },
    [{
      get: '/any',
      captured: ['/any']
    }, {
      post: '/any?params',
      captured: ['/any?params']
    }, {
      put: '/any?params'
    }]
  )

  test('method and url matching',
    {
      method: 'GET',
      match: '/any'
    },
    [{
      get: '/any',
      captured: ['']
    }, {
      get: '/any?params',
      captured: ['?params']
    }, {
      get: '/nope'
    }, {
      post: '/any'
    }]
  )

  test('synchronous if-mach returning true',
    {
      method: 'GET',
      match: '/any',
      'if-match': () => true
    },
    [{
      get: '/any',
      captured: ['']
    }, {
      get: '/any?params',
      captured: ['?params']
    }, {
      get: '/nope'
    }, {
      post: '/any'
    }]
  )

  test('synchronous if-mach returning false',
    {
      method: 'GET',
      match: '/any',
      'if-match': () => false
    },
    [{
      get: '/any'
    }, {
      get: '/any?params'
    }, {
      get: '/nope'
    }, {
      post: '/any'
    }]
  )
})
