/* global describe, it */
'use strict'

const assert = require('assert')
const Request = require('../mock/Request')
const Response = require('../mock/Response')
const handler = require('./rate-limit')
const { $handlerPrefix, $schema } = require('../symbols')

function createRequest ({ headers = {}, remoteAddress } = {}) {
  const request = new Request('GET', '/test', headers)

  if (remoteAddress !== undefined) {
    Object.defineProperty(request.socket, 'remoteAddress', {
      configurable: true,
      value: remoteAddress
    })
  }

  return request
}

describe('handlers/rate-limit', () => {
  it('exposes the right handler prefix', () => {
    assert.strictEqual(handler[$handlerPrefix], 'rate-limit')
  })

  it('exposes the right schema', () => {
    assert.deepStrictEqual(handler[$schema], {
      'rate-limit': ['boolean', 'object']
    })
  })

  it('ignores disabled rate-limit configuration', () => {
    const mapping = {
      'rate-limit': false
    }

    assert.strictEqual(handler.validate(mapping), undefined)
    assert.strictEqual(mapping['rate-limit'], false)
  })

  it('ignores missing rate-limit configuration', () => {
    const mapping = {}

    assert.strictEqual(handler.validate(mapping), undefined)
    assert.strictEqual(mapping['rate-limit'], undefined)
  })

  it('applies default options', () => {
    const mapping = {
      'rate-limit': true
    }

    handler.validate(mapping)

    assert.deepStrictEqual(mapping['rate-limit'], {
      algorithm: 'fixed-window',
      limit: 10,
      windowMs: 60000,
      key: { type: 'ip' },
      whitelist: [],
      blacklist: []
    })
  })

  it('applies token-bucket defaults', () => {
    const mapping = {
      'rate-limit': {
        algorithm: 'token-bucket'
      }
    }

    handler.validate(mapping)

    assert.deepStrictEqual(mapping['rate-limit'], {
      algorithm: 'token-bucket',
      capacity: 10,
      refillRate: 10,
      refillIntervalMs: 60000,
      key: { type: 'ip' },
      whitelist: [],
      blacklist: []
    })
  })

  it('applies sliding-window defaults', () => {
    const mapping = {
      'rate-limit': {
        algorithm: 'sliding-window'
      }
    }

    handler.validate(mapping)

    assert.deepStrictEqual(mapping['rate-limit'], {
      algorithm: 'sliding-window',
      limit: 10,
      windowMs: 60000,
      key: { type: 'ip' },
      whitelist: [],
      blacklist: []
    })
  })

  it('applies concurrent-requests defaults', () => {
    const mapping = {
      'rate-limit': {
        algorithm: 'concurrent-requests'
      }
    }

    handler.validate(mapping)

    assert.deepStrictEqual(mapping['rate-limit'], {
      algorithm: 'concurrent-requests',
      max: 10,
      retryAfterMs: 1000,
      key: { type: 'ip' },
      whitelist: [],
      blacklist: []
    })
  })

  it('keeps explicit fixed-window options', () => {
    const mapping = {
      'rate-limit': {
        algorithm: 'fixed-window',
        limit: 3,
        windowMs: 500
      }
    }

    handler.validate(mapping)

    assert.deepStrictEqual(mapping['rate-limit'], {
      algorithm: 'fixed-window',
      limit: 3,
      windowMs: 500,
      key: { type: 'ip' },
      whitelist: [],
      blacklist: []
    })
  })

  it('keeps explicit token-bucket options', () => {
    const mapping = {
      'rate-limit': {
        algorithm: 'token-bucket',
        capacity: 2,
        refillRate: 1,
        refillIntervalMs: 1000
      }
    }

    handler.validate(mapping)

    assert.deepStrictEqual(mapping['rate-limit'], {
      algorithm: 'token-bucket',
      capacity: 2,
      refillRate: 1,
      refillIntervalMs: 1000,
      key: { type: 'ip' },
      whitelist: [],
      blacklist: []
    })
  })

  it('rejects unsupported algorithms', () => {
    const mapping = {
      'rate-limit': {
        algorithm: 'nope'
      }
    }

    assert.throws(() => {
      handler.validate(mapping)
    }, /Unsupported rate-limit algorithm/)
  })

  it('returns undefined when redirect is called without rate-limit config', () => {
    const response = new Response()

    assert.strictEqual(handler.redirect({
      mapping: {},
      request: createRequest(),
      response
    }), undefined)

    assert.strictEqual(response.isInitial(), true)
  })

  it('uses x-forwarded-for as default IP key and blocks above limit', () => {
    const mapping = {
      'rate-limit': {
        limit: 2,
        windowMs: 1000
      }
    }

    handler.validate(mapping)

    const firstResponse = new Response()
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-forwarded-for': '10.0.0.1'
        }
      }),
      response: firstResponse
    })
    assert.strictEqual(firstResponse.isInitial(), true)

    const secondResponse = new Response()
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-forwarded-for': '10.0.0.1'
        }
      }),
      response: secondResponse
    })
    assert.strictEqual(secondResponse.isInitial(), true)

    const thirdResponse = new Response()
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-forwarded-for': '10.0.0.1'
        }
      }),
      response: thirdResponse
    })
    assert.strictEqual(thirdResponse.statusCode, 429)
  })

  it('uses configured header as key', () => {
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000,
        key: {
          type: 'header',
          name: 'x-client-id'
        }
      }
    }

    handler.validate(mapping)

    const firstResponse = new Response()
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-client-id': 'client-1'
        }
      }),
      response: firstResponse
    })
    assert.strictEqual(firstResponse.isInitial(), true)

    const secondResponse = new Response()
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-client-id': 'client-1'
        }
      }),
      response: secondResponse
    })
    assert.strictEqual(secondResponse.statusCode, 429)

    const thirdResponse = new Response()
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-client-id': 'client-2'
        }
      }),
      response: thirdResponse
    })
    assert.strictEqual(thirdResponse.isInitial(), true)
  })

  it('uses query parameter as key', () => {
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000,
        key: {
          type: 'query',
          name: 'apiKey'
        }
      }
    }

    handler.validate(mapping)

    const firstResponse = new Response()
    handler.redirect({
      mapping,
      request: createRequest(),
      response: firstResponse
    })
    assert.strictEqual(firstResponse.isInitial(), true)

    const secondResponse = new Response()
    handler.redirect({
      mapping,
      request: new Request('GET', '/test?apiKey=client-1'),
      response: secondResponse
    })
    assert.strictEqual(secondResponse.isInitial(), true)

    const thirdResponse = new Response()
    handler.redirect({
      mapping,
      request: new Request('GET', '/test?apiKey=client-1'),
      response: thirdResponse
    })
    assert.strictEqual(thirdResponse.statusCode, 429)
  })

  it('uses unknown query key when request url is missing', () => {
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000,
        key: {
          type: 'query',
          name: 'apiKey'
        }
      }
    }

    handler.validate(mapping)

    const firstResponse = new Response()
    handler.redirect({
      mapping,
      request: {
        headers: {},
        socket: {}
      },
      response: firstResponse
    })
    assert.strictEqual(firstResponse.isInitial(), true)

    const secondResponse = new Response()
    handler.redirect({
      mapping,
      request: {
        headers: {},
        socket: {}
      },
      response: secondResponse
    })
    assert.strictEqual(secondResponse.statusCode, 429)
  })

  it('uses body parameter as key', () => {
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000,
        key: {
          type: 'body',
          name: 'client'
        }
      }
    }

    handler.validate(mapping)

    const firstResponse = new Response()
    handler.redirect({
      mapping,
      request: new Request('POST', '/test', {
        'content-type': 'application/json'
      }, '{"client":"body-client"}'),
      response: firstResponse
    })
    assert.strictEqual(firstResponse.isInitial(), true)

    const secondResponse = new Response()
    handler.redirect({
      mapping,
      request: new Request('POST', '/test', {
        'content-type': 'application/json'
      }, '{"client":"body-client"}'),
      response: secondResponse
    })
    assert.strictEqual(secondResponse.statusCode, 429)
  })

  it('uses object body parameter as key', () => {
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000,
        key: {
          type: 'body',
          name: 'client'
        }
      }
    }

    handler.validate(mapping)

    const firstResponse = new Response()
    handler.redirect({
      mapping,
      request: {
        headers: {},
        socket: {},
        body: {
          client: 'object-client'
        }
      },
      response: firstResponse
    })
    assert.strictEqual(firstResponse.isInitial(), true)

    const secondResponse = new Response()
    handler.redirect({
      mapping,
      request: {
        headers: {},
        socket: {},
        body: {
          client: 'object-client'
        }
      },
      response: secondResponse
    })
    assert.strictEqual(secondResponse.statusCode, 429)
  })

  it('uses unknown key when body is missing or invalid', () => {
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000,
        key: {
          type: 'body',
          name: 'client'
        }
      }
    }

    handler.validate(mapping)

    const firstResponse = new Response()
    handler.redirect({
      mapping,
      request: {
        headers: {},
        socket: {}
      },
      response: firstResponse
    })
    assert.strictEqual(firstResponse.isInitial(), true)

    const secondResponse = new Response()
    handler.redirect({
      mapping,
      request: new Request('POST', '/test', 'not-json'),
      response: secondResponse
    })
    assert.strictEqual(secondResponse.statusCode, 429)
  })

  it('supports array composite keys', () => {
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000,
        key: [{
          type: 'header',
          name: 'x-api-key'
        }, {
          type: 'query',
          name: 'tenant'
        }]
      }
    }

    handler.validate(mapping)

    const firstResponse = new Response()
    handler.redirect({
      mapping,
      request: new Request('GET', '/test?tenant=a', {
        'x-api-key': 'client'
      }),
      response: firstResponse
    })
    assert.strictEqual(firstResponse.isInitial(), true)

    const secondResponse = new Response()
    handler.redirect({
      mapping,
      request: new Request('GET', '/test?tenant=a', {
        'x-api-key': 'client'
      }),
      response: secondResponse
    })
    assert.strictEqual(secondResponse.statusCode, 429)
  })

  it('uses default key options inside array composite keys', () => {
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000,
        key: [undefined]
      }
    }

    handler.validate(mapping)

    const firstResponse = new Response()
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-forwarded-for': 'array-default'
        }
      }),
      response: firstResponse
    })
    assert.strictEqual(firstResponse.isInitial(), true)

    const secondResponse = new Response()
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-forwarded-for': 'array-default'
        }
      }),
      response: secondResponse
    })
    assert.strictEqual(secondResponse.statusCode, 429)
  })

  it('uses session id as key', () => {
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000,
        key: {
          type: 'session'
        }
      }
    }

    handler.validate(mapping)

    const firstResponse = new Response()
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {},
        remoteAddress: 'same-ip'
      }),
      response: firstResponse
    })
    assert.strictEqual(firstResponse.isInitial(), true)

    const secondResponse = new Response()
    handler.redirect({
      mapping,
      request: new Request({
        method: 'GET',
        url: '/test',
        properties: {
          session: {
            id: 'session-1'
          }
        }
      }),
      response: secondResponse
    })
    assert.strictEqual(secondResponse.isInitial(), true)

    const thirdResponse = new Response()
    handler.redirect({
      mapping,
      request: new Request({
        method: 'GET',
        url: '/test',
        properties: {
          session: {
            id: 'session-1'
          }
        }
      }),
      response: thirdResponse
    })
    assert.strictEqual(thirdResponse.statusCode, 429)
  })

  it('uses request sessionID as key', () => {
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000,
        key: {
          type: 'session'
        }
      }
    }

    handler.validate(mapping)

    const firstResponse = new Response()
    handler.redirect({
      mapping,
      request: {
        headers: {},
        socket: {},
        sessionID: 'session-id'
      },
      response: firstResponse
    })
    assert.strictEqual(firstResponse.isInitial(), true)

    const secondResponse = new Response()
    handler.redirect({
      mapping,
      request: {
        headers: {},
        socket: {},
        sessionID: 'session-id'
      },
      response: secondResponse
    })
    assert.strictEqual(secondResponse.statusCode, 429)
  })

  it('uses empty composite key when parts are omitted', () => {
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000,
        key: {
          type: 'composite'
        }
      }
    }

    handler.validate(mapping)

    const firstResponse = new Response()
    handler.redirect({
      mapping,
      request: createRequest(),
      response: firstResponse
    })
    assert.strictEqual(firstResponse.isInitial(), true)

    const secondResponse = new Response()
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-forwarded-for': 'different-ip'
        }
      }),
      response: secondResponse
    })
    assert.strictEqual(secondResponse.statusCode, 429)
  })

  it('supports composite keys', () => {
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000,
        key: {
          type: 'composite',
          parts: [{
            type: 'header',
            name: 'x-api-key'
          }, {
            type: 'query',
            name: 'tenant'
          }]
        }
      }
    }

    handler.validate(mapping)

    const firstResponse = new Response()
    handler.redirect({
      mapping,
      request: new Request('GET', '/test?tenant=a', {
        'x-api-key': 'client'
      }),
      response: firstResponse
    })
    assert.strictEqual(firstResponse.isInitial(), true)

    const secondResponse = new Response()
    handler.redirect({
      mapping,
      request: new Request('GET', '/test?tenant=b', {
        'x-api-key': 'client'
      }),
      response: secondResponse
    })
    assert.strictEqual(secondResponse.isInitial(), true)

    const thirdResponse = new Response()
    handler.redirect({
      mapping,
      request: new Request('GET', '/test?tenant=a', {
        'x-api-key': 'client'
      }),
      response: thirdResponse
    })
    assert.strictEqual(thirdResponse.statusCode, 429)
  })

  it('supports exact header name lookup', () => {
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000,
        key: {
          type: 'header',
          name: 'X-Client-Id'
        }
      }
    }

    handler.validate(mapping)

    const firstResponse = new Response()
    handler.redirect({
      mapping,
      request: {
        headers: {
          'X-Client-Id': 'client-1'
        },
        socket: {}
      },
      response: firstResponse
    })
    assert.strictEqual(firstResponse.isInitial(), true)

    const secondResponse = new Response()
    handler.redirect({
      mapping,
      request: {
        headers: {
          'X-Client-Id': 'client-1'
        },
        socket: {}
      },
      response: secondResponse
    })
    assert.strictEqual(secondResponse.statusCode, 429)
  })

  it('supports lowercase stored header lookup with mixed-case configured name', () => {
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000,
        key: {
          type: 'header',
          name: 'X-Client-Id'
        }
      }
    }

    handler.validate(mapping)

    const firstResponse = new Response()
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-client-id': 'client-lowercase'
        }
      }),
      response: firstResponse
    })
    assert.strictEqual(firstResponse.isInitial(), true)

    const secondResponse = new Response()
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-client-id': 'client-lowercase'
        }
      }),
      response: secondResponse
    })
    assert.strictEqual(secondResponse.statusCode, 429)
  })

  it('supports lowercase stored header lookup with plain headers object', () => {
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000,
        key: {
          type: 'header',
          name: 'X-Client-Id'
        }
      }
    }

    handler.validate(mapping)

    const firstResponse = new Response()
    handler.redirect({
      mapping,
      request: {
        headers: {
          'x-client-id': 'client-plain-lowercase'
        },
        socket: {}
      },
      response: firstResponse
    })
    assert.strictEqual(firstResponse.isInitial(), true)

    const secondResponse = new Response()
    handler.redirect({
      mapping,
      request: {
        headers: {
          'x-client-id': 'client-plain-lowercase'
        },
        socket: {}
      },
      response: secondResponse
    })
    assert.strictEqual(secondResponse.statusCode, 429)
  })

  it('supports case-insensitive header lookup through matching header names', () => {
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000,
        key: {
          type: 'header',
          name: 'X-Client-Id'
        }
      }
    }

    handler.validate(mapping)

    const firstResponse = new Response()
    handler.redirect({
      mapping,
      request: {
        headers: {
          'X-CLIENT-ID': 'client-upper'
        },
        socket: {}
      },
      response: firstResponse
    })
    assert.strictEqual(firstResponse.isInitial(), true)

    const secondResponse = new Response()
    handler.redirect({
      mapping,
      request: {
        headers: {
          'X-CLIENT-ID': 'client-upper'
        },
        socket: {}
      },
      response: secondResponse
    })
    assert.strictEqual(secondResponse.statusCode, 429)
  })

  it('keeps non-string header values as keys', () => {
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000,
        key: {
          type: 'header',
          name: 'x-client-id'
        }
      }
    }

    handler.validate(mapping)

    const firstResponse = new Response()
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-client-id': 123
        }
      }),
      response: firstResponse
    })
    assert.strictEqual(firstResponse.isInitial(), true)

    const secondResponse = new Response()
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-client-id': 123
        }
      }),
      response: secondResponse
    })
    assert.strictEqual(secondResponse.statusCode, 429)
  })

  it('keeps non-string plain header values as keys', () => {
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000,
        key: {
          type: 'header',
          name: 'x-client-id'
        }
      }
    }

    handler.validate(mapping)

    const firstResponse = new Response()
    handler.redirect({
      mapping,
      request: {
        headers: {
          'x-client-id': 456
        },
        socket: {}
      },
      response: firstResponse
    })
    assert.strictEqual(firstResponse.isInitial(), true)

    const secondResponse = new Response()
    handler.redirect({
      mapping,
      request: {
        headers: {
          'x-client-id': 456
        },
        socket: {}
      },
      response: secondResponse
    })
    assert.strictEqual(secondResponse.statusCode, 429)
  })

  it('uses remoteAddress as key and resets expired window', () => {
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000
      }
    }

    handler.validate(mapping)

    const realNow = Date.now

    try {
      Date.now = () => 0

      const firstResponse = new Response()
      handler.redirect({
        mapping,
        request: createRequest({
          remoteAddress: '127.0.0.1'
        }),
        response: firstResponse
      })
      assert.strictEqual(firstResponse.isInitial(), true)

      const secondResponse = new Response()
      handler.redirect({
        mapping,
        request: createRequest({
          remoteAddress: '127.0.0.1'
        }),
        response: secondResponse
      })
      assert.strictEqual(secondResponse.statusCode, 429)

      Date.now = () => 1000

      const thirdResponse = new Response()
      handler.redirect({
        mapping,
        request: createRequest({
          remoteAddress: '127.0.0.1'
        }),
        response: thirdResponse
      })
      assert.strictEqual(thirdResponse.isInitial(), true)
    } finally {
      Date.now = realNow
    }
  })

  it('falls back to ip strategy when header name is missing', () => {
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000,
        key: {
          type: 'header'
        }
      }
    }

    handler.validate(mapping)

    const firstResponse = new Response()
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-forwarded-for': '20.0.0.1'
        }
      }),
      response: firstResponse
    })
    assert.strictEqual(firstResponse.isInitial(), true)

    const secondResponse = new Response()
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-forwarded-for': '20.0.0.1'
        }
      }),
      response: secondResponse
    })
    assert.strictEqual(secondResponse.statusCode, 429)
  })

  it('falls back to unknown key when configured header is missing', () => {
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000,
        key: {
          type: 'header',
          name: 'x-api-key'
        }
      }
    }

    handler.validate(mapping)

    const firstResponse = new Response()
    handler.redirect({
      mapping,
      request: createRequest(),
      response: firstResponse
    })
    assert.strictEqual(firstResponse.isInitial(), true)

    const secondResponse = new Response()
    handler.redirect({
      mapping,
      request: createRequest(),
      response: secondResponse
    })
    assert.strictEqual(secondResponse.statusCode, 429)
  })

  it('falls back to unknown ip key when there is no forwarded header and no remoteAddress', () => {
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000
      }
    }

    handler.validate(mapping)

    const firstResponse = new Response()
    handler.redirect({
      mapping,
      request: {
        headers: {},
        socket: {}
      },
      response: firstResponse
    })
    assert.strictEqual(firstResponse.isInitial(), true)

    const secondResponse = new Response()
    handler.redirect({
      mapping,
      request: {
        headers: {},
        socket: {}
      },
      response: secondResponse
    })
    assert.strictEqual(secondResponse.statusCode, 429)
  })

  it('bypasses rate limiting for whitelisted keys', () => {
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000,
        whitelist: ['30.0.0.1']
      }
    }

    handler.validate(mapping)

    const firstResponse = new Response()
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-forwarded-for': '30.0.0.1'
        }
      }),
      response: firstResponse
    })
    assert.strictEqual(firstResponse.isInitial(), true)

    const secondResponse = new Response()
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-forwarded-for': '30.0.0.1'
        }
      }),
      response: secondResponse
    })
    assert.strictEqual(secondResponse.isInitial(), true)
  })

  it('blocks blacklisted keys immediately', () => {
    const mapping = {
      'rate-limit': {
        blacklist: ['31.0.0.1']
      }
    }

    handler.validate(mapping)

    const response = new Response()
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-forwarded-for': '31.0.0.1'
        }
      }),
      response
    })

    assert.strictEqual(response.statusCode, 429)
    assert.strictEqual(response.getHeader('Retry-After'), '1')
  })

  it('blocks when token-bucket capacity is exhausted', () => {
    const mapping = {
      'rate-limit': {
        algorithm: 'token-bucket',
        capacity: 2,
        refillRate: 1,
        refillIntervalMs: 1000
      }
    }

    handler.validate(mapping)

    const realNow = Date.now

    try {
      Date.now = () => 0

      const firstResponse = new Response()
      handler.redirect({
        mapping,
        request: createRequest({
          headers: {
            'x-forwarded-for': '32.0.0.1'
          }
        }),
        response: firstResponse
      })
      assert.strictEqual(firstResponse.isInitial(), true)

      const secondResponse = new Response()
      handler.redirect({
        mapping,
        request: createRequest({
          headers: {
            'x-forwarded-for': '32.0.0.1'
          }
        }),
        response: secondResponse
      })
      assert.strictEqual(secondResponse.isInitial(), true)

      const thirdResponse = new Response()
      handler.redirect({
        mapping,
        request: createRequest({
          headers: {
            'x-forwarded-for': '32.0.0.1'
          }
        }),
        response: thirdResponse
      })
      assert.strictEqual(thirdResponse.statusCode, 429)
    } finally {
      Date.now = realNow
    }
  })

  it('blocks when concurrent request limit is exhausted and releases after finish', async () => {
    const mapping = {
      'rate-limit': {
        algorithm: 'concurrent-requests',
        max: 1
      }
    }

    handler.validate(mapping)

    const firstResponse = new Response()
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-forwarded-for': '70.0.0.1'
        }
      }),
      response: firstResponse
    })
    assert.strictEqual(firstResponse.isInitial(), true)

    const secondResponse = new Response()
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-forwarded-for': '70.0.0.1'
        }
      }),
      response: secondResponse
    })
    assert.strictEqual(secondResponse.statusCode, 429)

    firstResponse.end()
    await firstResponse.waitForFinish()

    const thirdResponse = new Response()
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-forwarded-for': '70.0.0.1'
        }
      }),
      response: thirdResponse
    })
    assert.strictEqual(thirdResponse.isInitial(), true)
  })

  it('keeps concurrent counter when another request is still running', async () => {
    const mapping = {
      'rate-limit': {
        algorithm: 'concurrent-requests',
        max: 2,
        retryAfterMs: 500
      }
    }
    const events = []

    handler.validate(mapping)

    const firstResponse = new Response()
    const secondResponse = new Response()
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-forwarded-for': '71.0.0.1'
        }
      }),
      response: firstResponse,
      emit: (event, payload) => events.push({ event, payload })
    })
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-forwarded-for': '71.0.0.1'
        }
      }),
      response: secondResponse,
      emit: (event, payload) => events.push({ event, payload })
    })

    firstResponse.end()
    await firstResponse.waitForFinish()

    assert.strictEqual(events.length, 0)

    secondResponse.end()
    await secondResponse.waitForFinish()
    secondResponse.emit('close')

    assert.strictEqual(events[0].payload.rateLimit.reason, 'concurrent-requests-reset')
  })

  it('does not emit warning before configured threshold', () => {
    const mapping = {
      'rate-limit': {
        limit: 2,
        windowMs: 1000,
        warningThreshold: 1
      }
    }
    const events = []

    handler.validate(mapping)
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-forwarded-for': '81.0.0.1'
        }
      }),
      response: new Response(),
      emit: (event, payload) => events.push({ event, payload })
    })

    assert.deepStrictEqual(events, [])
  })

  it('supports onLimit redispatch target', () => {
    const mapping = {
      'rate-limit': {
        limit: 0,
        windowMs: 1000,
        onLimit: '/blocked'
      }
    }

    handler.validate(mapping)

    const response = new Response()
    assert.strictEqual(handler.redirect({
      mapping,
      request: createRequest(),
      response
    }), '/blocked')
    assert.strictEqual(response.isInitial(), true)
  })

  it('emits exceeded and warning events', () => {
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000,
        warningThreshold: 1
      }
    }
    const events = []
    const emit = (event, payload) => events.push({ event, payload })

    handler.validate(mapping)

    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-forwarded-for': '80.0.0.1'
        }
      }),
      response: new Response(),
      emit
    })

    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-forwarded-for': '80.0.0.1'
        }
      }),
      response: new Response(),
      emit
    })

    assert.strictEqual(events.length, 2)
    assert.strictEqual(events[0].payload.rateLimit.reason, 'threshold-reached')
    assert.strictEqual(events[1].payload.rateLimit.reason, 'fixed-window-exhausted')
  })

  it('supports custom stores', () => {
    const records = new Map()
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000,
        store: {
          type: 'custom',
          instance: {
            get: key => records.get(key),
            set: (key, value) => records.set(key, value)
          }
        }
      }
    }

    handler.validate(mapping)

    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-forwarded-for': '90.0.0.1'
        }
      }),
      response: new Response()
    })

    const response = new Response()
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-forwarded-for': '90.0.0.1'
        }
      }),
      response
    })
    assert.strictEqual(response.statusCode, 429)
  })

  it('supports custom stores using implementation', () => {
    const records = new Map()
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000,
        store: {
          type: 'custom',
          implementation: {
            get: key => records.get(key),
            set: (key, value) => records.set(key, value)
          }
        }
      }
    }

    handler.validate(mapping)

    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-forwarded-for': '90.0.0.2'
        }
      }),
      response: new Response()
    })

    const response = new Response()
    handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-forwarded-for': '90.0.0.2'
        }
      }),
      response
    })
    assert.strictEqual(response.statusCode, 429)
  })

  it('rejects invalid store configuration', () => {
    assert.throws(() => handler.validate({
      'rate-limit': {
        store: 'unknown'
      }
    }), /Unsupported rate-limit store/)

    assert.throws(() => handler.validate({
      'rate-limit': {
        store: {
          type: 'custom',
          instance: {}
        }
      }
    }), /Custom rate-limit store/)

    assert.throws(() => handler.validate({
      'rate-limit': {
        store: {
          type: 'redis',
          client: {}
        }
      }
    }), /Redis rate-limit store/)
  })

  it('exposes in-memory store helpers', () => {
    const store = new handler.MemoryStore()

    assert.strictEqual(store.decrement('missing'), 0)
    assert.strictEqual(store.increment('key'), 1)
    assert.strictEqual(store.increment('key', 2), 3)
    assert.strictEqual(store.decrement('key', 2), 1)
    assert.strictEqual(store.delete('key'), true)
    assert.strictEqual(store.get('key'), undefined)
  })

  it('supports redis stores with compatible clients', async () => {
    const records = new Map()
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000,
        store: {
          type: 'redis',
          client: {
            get: async key => records.get(key),
            set: async (key, value) => records.set(key, value)
          }
        }
      }
    }

    handler.validate(mapping)

    await handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-forwarded-for': '91.0.0.1'
        }
      }),
      response: new Response()
    })

    const response = new Response()
    await handler.redirect({
      mapping,
      request: createRequest({
        headers: {
          'x-forwarded-for': '91.0.0.1'
        }
      }),
      response
    })
    assert.strictEqual(response.statusCode, 429)
  })

  it('supports explicit memory store configuration', () => {
    const mapping = {
      'rate-limit': {
        limit: 1,
        windowMs: 1000,
        store: 'memory'
      }
    }

    handler.validate(mapping)

    const response = new Response()
    handler.redirect({
      mapping,
      request: createRequest(),
      response
    })
    assert.strictEqual(response.isInitial(), true)
  })

  it('exposes redis store helpers', async () => {
    const records = new Map()
    const deleted = []
    const store = new handler.RedisStore({
      get: async key => records.get(key),
      set: async (key, value) => records.set(key, value),
      del: async key => deleted.push(key),
      incr: async key => {
        const nextValue = (JSON.parse(records.get(key) || '0')) + 1
        records.set(key, JSON.stringify(nextValue))
        return nextValue
      }
    })

    assert.strictEqual(await store.get('missing'), undefined)
    assert.strictEqual(await store.increment('counter'), 1)
    assert.strictEqual(await store.increment('counter', 2), 3)
    assert.strictEqual(await store.decrement('counter'), 2)
    await store.delete('counter')
    assert.deepStrictEqual(deleted, ['counter'])
  })

  it('exposes redis store helpers without optional methods', async () => {
    const records = new Map()
    const store = new handler.RedisStore({
      get: async key => records.get(key),
      set: async (key, value) => records.set(key, value)
    })

    assert.strictEqual(await store.increment('counter'), 1)
    assert.strictEqual(await store.decrement('missing'), 0)
    assert.strictEqual(await store.delete('missing'), undefined)
  })

  it('exposes redis store set without client set method', async () => {
    const store = new handler.RedisStore({
      get: async () => undefined
    })

    assert.deepStrictEqual(await store.set('key', { value: true }), { value: true })
  })

  it('refills token-bucket over time', () => {
    const mapping = {
      'rate-limit': {
        algorithm: 'token-bucket',
        capacity: 1,
        refillRate: 1,
        refillIntervalMs: 1000
      }
    }

    handler.validate(mapping)

    const realNow = Date.now

    try {
      Date.now = () => 0

      const firstResponse = new Response()
      handler.redirect({
        mapping,
        request: createRequest({
          headers: {
            'x-forwarded-for': '33.0.0.1'
          }
        }),
        response: firstResponse
      })
      assert.strictEqual(firstResponse.isInitial(), true)

      const secondResponse = new Response()
      handler.redirect({
        mapping,
        request: createRequest({
          headers: {
            'x-forwarded-for': '33.0.0.1'
          }
        }),
        response: secondResponse
      })
      assert.strictEqual(secondResponse.statusCode, 429)

      Date.now = () => 1000

      const thirdResponse = new Response()
      handler.redirect({
        mapping,
        request: createRequest({
          headers: {
            'x-forwarded-for': '33.0.0.1'
          }
        }),
        response: thirdResponse
      })
      assert.strictEqual(thirdResponse.isInitial(), true)
    } finally {
      Date.now = realNow
    }
  })

  it('blocks burst on window boundary with sliding-window', () => {
    const mapping = {
      'rate-limit': {
        algorithm: 'sliding-window',
        limit: 2,
        windowMs: 1000
      }
    }

    handler.validate(mapping)

    const realNow = Date.now

    try {
      Date.now = () => 900

      const firstResponse = new Response()
      handler.redirect({
        mapping,
        request: createRequest({
          headers: {
            'x-forwarded-for': '40.0.0.1'
          }
        }),
        response: firstResponse
      })
      assert.strictEqual(firstResponse.isInitial(), true)

      Date.now = () => 950

      const secondResponse = new Response()
      handler.redirect({
        mapping,
        request: createRequest({
          headers: {
            'x-forwarded-for': '40.0.0.1'
          }
        }),
        response: secondResponse
      })
      assert.strictEqual(secondResponse.isInitial(), true)

      Date.now = () => 1000

      const thirdResponse = new Response()
      handler.redirect({
        mapping,
        request: createRequest({
          headers: {
            'x-forwarded-for': '40.0.0.1'
          }
        }),
        response: thirdResponse
      })
      assert.strictEqual(thirdResponse.statusCode, 429)
      assert.strictEqual(thirdResponse.getHeader('Retry-After'), '1')
    } finally {
      Date.now = realNow
    }
  })

  it('releases sliding-window pressure over time', () => {
    const mapping = {
      'rate-limit': {
        algorithm: 'sliding-window',
        limit: 2,
        windowMs: 1000
      }
    }

    handler.validate(mapping)

    const realNow = Date.now

    try {
      Date.now = () => 900

      const firstResponse = new Response()
      handler.redirect({
        mapping,
        request: createRequest({
          headers: {
            'x-forwarded-for': '50.0.0.1'
          }
        }),
        response: firstResponse
      })
      assert.strictEqual(firstResponse.isInitial(), true)

      Date.now = () => 950

      const secondResponse = new Response()
      handler.redirect({
        mapping,
        request: createRequest({
          headers: {
            'x-forwarded-for': '50.0.0.1'
          }
        }),
        response: secondResponse
      })
      assert.strictEqual(secondResponse.isInitial(), true)

      Date.now = () => 1501

      const thirdResponse = new Response()
      handler.redirect({
        mapping,
        request: createRequest({
          headers: {
            'x-forwarded-for': '50.0.0.1'
          }
        }),
        response: thirdResponse
      })
      assert.strictEqual(thirdResponse.isInitial(), true)
    } finally {
      Date.now = realNow
    }
  })

  it('drops previous sliding-window pressure after skipping more than one window', () => {
    const mapping = {
      'rate-limit': {
        algorithm: 'sliding-window',
        limit: 1,
        windowMs: 1000
      }
    }

    handler.validate(mapping)

    const realNow = Date.now

    try {
      Date.now = () => 100

      const firstResponse = new Response()
      handler.redirect({
        mapping,
        request: createRequest({
          headers: {
            'x-forwarded-for': '60.0.0.1'
          }
        }),
        response: firstResponse
      })
      assert.strictEqual(firstResponse.isInitial(), true)

      Date.now = () => 3100

      const secondResponse = new Response()
      handler.redirect({
        mapping,
        request: createRequest({
          headers: {
            'x-forwarded-for': '60.0.0.1'
          }
        }),
        response: secondResponse
      })
      assert.strictEqual(secondResponse.isInitial(), true)
    } finally {
      Date.now = realNow
    }
  })

  it('uses default key options and default headers object', () => {
    const mapping = {
      'rate-limit': {
        algorithm: 'fixed-window',
        limit: 1,
        windowMs: 1000,
        whitelist: [],
        blacklist: []
      }
    }

    const firstResponse = new Response()
    handler.redirect({
      mapping,
      request: {
        socket: {}
      },
      response: firstResponse
    })
    assert.strictEqual(firstResponse.isInitial(), true)

    const secondResponse = new Response()
    handler.redirect({
      mapping,
      request: {
        socket: {}
      },
      response: secondResponse
    })
    assert.strictEqual(secondResponse.statusCode, 429)
  })
})
