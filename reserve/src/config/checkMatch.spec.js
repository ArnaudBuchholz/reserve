'use strict'
const { describe, it, before } = require('mocha')
const assert = require('assert')
const checkMatch = require('./checkMatch')
const checkMethod = require('./checkMethod')
const { $mappingMatch, $mappingMethod } = require('../symbols')
const Request = require('../mock/Request')

function test (label, mapping, matches) {
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
      const request = new Request({ method, url })
      const itMethod = only ? it.only : it
      if (expectedCaptured === undefined) {
        itMethod(`ignores ${method} ${url}`, async () => {
          const match = await mapping[$mappingMatch](url, request)
          assert.ok(!match)
        })

        if (invertMatchMapping !== undefined) {
          itMethod(`matches ${method} ${url} (invert-match)`, async () => {
            const match = await invertMatchMapping[$mappingMatch](url, request)
            assert.deepStrictEqual(match, [])
          })
        }
      } else {
        itMethod(`matches ${method} ${url}`, async () => {
          const match = await mapping[$mappingMatch](url, request)
          if (!Array.isArray(expectedCaptured)) {
            assert.strictEqual(match, expectedCaptured)
          } else {
            const [, ...captured] = match
            assert.deepStrictEqual(captured, expectedCaptured)
            const { groups } = match
            assert.deepStrictEqual(groups, expectedNamed)
          }
        })

        if (invertMatchMapping !== undefined) {
          itMethod(`ignores ${method} ${url}  (invert-match)`, async () => {
            const match = await invertMatchMapping[$mappingMatch](url, request)
            assert.ok(!match)
          })
        }
      }
    }
  })
}

function testSyncAsync (label, mapping, matches) {
  test(`synchronous ${label}`, mapping, matches)
  test(`asynchronous ${label}`, {
    ...mapping,
    'if-match': async (...args) => mapping['if-match'](...args)
  }, matches)
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

  testSyncAsync('if-mach returning true',
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

  testSyncAsync('if-mach returning false',
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

  testSyncAsync('if-match returning a string (truthy)',
    {
      method: 'GET',
      match: '/any',
      'if-match': () => 'new_url'
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

  testSyncAsync('if-match returning a string (falsy)',
    {
      method: 'GET',
      match: '/any',
      'if-match': () => ''
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

  testSyncAsync('if-match returning a number (truthy)',
    {
      method: 'GET',
      match: '/any',
      'if-match': () => 404
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

  testSyncAsync('if-match returning a number (falsy)',
    {
      method: 'GET',
      match: '/any',
      'if-match': () => 0
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

  testSyncAsync('if-match returning an array',
    {
      method: 'GET',
      match: '/any',
      'if-match': ({ method, url }, match) => [0, method, url, ...match]
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
})
