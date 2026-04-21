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
