'use strict'
const { describe, it, before } = require('mocha')
const assert = require('assert')
const checkMatch = require('./checkMatch')
const checkMethod = require('./checkMethod')
const { $mappingMatch, $mappingMethod } = require('../symbols')

async function test (label, mapping, matches) {
  describe(label, () => {
    before(() => {
      checkMethod(mapping, $mappingMethod)
      checkMatch(mapping)
      assert.strictEqual(typeof mapping[$mappingMatch], 'function')
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
      } else {
        itMethod(`matches ${method} ${url}`, async () => {
          const match = await mapping[$mappingMatch](url, { method })
          if (expectedCaptured === true) {
            assert.strictEqual(match, true)
          } else {
            const [, ...captured] = match
            assert.deepEqual(captured, expectedCaptured)
            const { groups } = match
            assert.deepEqual(groups, expectedNamed)
          }
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

  describe('invert-match', () => {
    test('no settings',
      {
        'invert-match': true
      },
      [{
        get: '/any'
      }]
    )

    test('url matching',
      {
        'invert-match': true,
        match: '/any'
      },
      [{
        get: '/any'
      }, {
        post: '/any?params'
      }, {
        only: true,
        get: '/nope',
        captured: true // TODO not sure about this
      }]
    )
/*
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
*/
  })
})
