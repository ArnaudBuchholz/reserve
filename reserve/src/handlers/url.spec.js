'use strict'

const mockRequire = require('mock-require')
const assert = require('assert')
const { notExpected, wrapHandler, http } = require('test-tools')
const urlHandler = require('./url')
const handle = wrapHandler(urlHandler)
const { $configuration } = require('../symbols')

const uid = Symbol('uid')

describe('handlers/url', () => {
  it('returns a promise', () => handle({
    request: http.urls.echo
  })
    .then(({ promise }) => {
      assert.strictEqual(typeof promise.then, 'function')
    })
  )

  it('pipes URL content', () => handle({
    request: {
      method: 'POST',
      url: http.urls.echo,
      headers: {
        'x-status-code': 200,
        'x-value-1': 'test',
        host: 'http://example.com'
      },
      body: 'Hello World!'
    }
  })
    .then(({ promise, response }) => promise.then(value => {
      assert.strictEqual(value, undefined)
      assert.strictEqual(response.statusCode, 200)
      assert.strictEqual(response.headers['x-value-1'], 'test')
      assert.strictEqual(response.headers.host, undefined)
      assert.strictEqual(response.toString(), 'Hello World!')
    }))
  )

  it('handles aborted requests', () => handle({
    request: {
      method: 'POST',
      url: http.urls.echo,
      headers: {
        'x-status-code': 200,
        'x-value-1': 'test',
        host: 'http://example.com'
      },
      body: 'Hello World!'
    }
  })
    .then(({ promise, request, response }) => {
      request.abort()
      return promise
        .then(value => {
          assert.strictEqual(value, undefined)
          assert.strictEqual(response.statusCode, 200)
          assert.strictEqual(response.headers['x-value-1'], 'test')
          assert.strictEqual(response.headers.host, undefined)
          assert.strictEqual(response.toString(), '')
        })
    })
  )

  it('pipes URL content (https)', () => handle({
    request: {
      method: 'POST',
      url: http.urls.echos,
      headers: {
        'x-status-code': 200
      },
      body: 'Hello World!'
    },
    mapping: {
      'ignore-unverifiable-certificate': true // No real way to validate here (but for coverage)
    }
  })
    .then(({ promise, response }) => promise.then(value => {
      assert.strictEqual(value, undefined)
      assert.strictEqual(response.statusCode, 200)
      assert.strictEqual(response.toString(), 'Hello World!')
    }))
  )

  describe('unsecure-cookies', () => {
    it('unsecures cookies (no SameSite)', () => handle({
      request: {
        method: 'GET',
        url: http.urls.echos,
        headers: {
          'x-status-code': 200,
          'Set-Cookie': ['name=value; Secure;']
        }
      },
      mapping: {
        'unsecure-cookies': true
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers['Set-Cookie'][0], 'name=value;')
      }))
    )

    it('unsecures cookies (no SameSite, no ending ;)', () => handle({
      request: {
        method: 'GET',
        url: http.urls.echos,
        headers: {
          'x-status-code': 200,
          'Set-Cookie': ['name=value; Secure']
        }
      },
      mapping: {
        'unsecure-cookies': true
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers['Set-Cookie'][0], 'name=value;')
      }))
    )

    it('unsecures cookies (SameSite=None)', () => handle({
      request: {
        method: 'GET',
        url: http.urls.echos,
        headers: {
          'x-status-code': 200,
          'Set-Cookie': ['name=value; SameSite=None; Secure;']
        }
      },
      mapping: {
        'unsecure-cookies': true
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers['Set-Cookie'][0], 'name=value; SameSite=Lax;')
      }))
    )

    it('unsecures cookies (SameSite=None, no ending ;)', () => handle({
      request: {
        method: 'GET',
        url: http.urls.echos,
        headers: {
          'x-status-code': 200,
          'Set-Cookie': ['name=value; SameSite=None; Secure']
        }
      },
      mapping: {
        'unsecure-cookies': true
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers['Set-Cookie'][0], 'name=value; SameSite=Lax;')
      }))
    )

    it('unsecures cookies (Secure first, SameSite=None, no ending ;)', () => handle({
      request: {
        method: 'GET',
        url: http.urls.echos,
        headers: {
          'x-status-code': 200,
          'Set-Cookie': ['name=value; Secure; SameSite=None']
        }
      },
      mapping: {
        'unsecure-cookies': true
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers['Set-Cookie'][0], 'name=value; SameSite=Lax;')
      }))
    )

    it('unsecures cookies (SameSite=Strict)', () => handle({
      request: {
        method: 'GET',
        url: http.urls.echos,
        headers: {
          'x-status-code': 200,
          'Set-Cookie': ['name=value; SameSite=Strict; Secure;']
        }
      },
      mapping: {
        'unsecure-cookies': true
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers['Set-Cookie'][0], 'name=value; SameSite=Strict;')
      }))
    )

    it('unsecures cookies (SameSite=Strict, no ending ;)', () => handle({
      request: {
        method: 'GET',
        url: http.urls.echos,
        headers: {
          'x-status-code': 200,
          'Set-Cookie': ['name=value; SameSite=Strict; Secure']
        }
      },
      mapping: {
        'unsecure-cookies': true
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers['Set-Cookie'][0], 'name=value; SameSite=Strict;')
      }))
    )

    it('unsecures cookies (Secure first, SameSite=Strict, no ending ;)', () => handle({
      request: {
        method: 'GET',
        url: http.urls.echos,
        headers: {
          'x-status-code': 200,
          'Set-Cookie': ['name=value; Secure; SameSite=Strict']
        }
      },
      mapping: {
        'unsecure-cookies': true
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers['Set-Cookie'][0], 'name=value; SameSite=Strict')
      }))
    )

    it('unsecures cookies (no change)', () => handle({
      request: {
        method: 'GET',
        url: http.urls.echos,
        headers: {
          'x-status-code': 200,
          'Set-Cookie': ['name=value; SameSite=Strict;']
        }
      },
      mapping: {
        'unsecure-cookies': true
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers['Set-Cookie'][0], 'name=value; SameSite=Strict;')
      }))
    )

    it('unsecures cookies (no cookies)', () => handle({
      request: {
        method: 'GET',
        url: http.urls.echos,
        headers: {
          'x-status-code': 200
        }
      },
      mapping: {
        'unsecure-cookies': true
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 200)
        assert.ok(!response.headers['Set-Cookie'])
      }))
    )
  })

  describe('forward-request and forward-response', () => {
    it('manipulates request details (forward-request)', () => handle({
      request: {
        method: 'GET',
        url: http.urls.echos,
        headers: {
          'x-status-code': 200,
          Cookie: 'name=value;'
        }
      },
      mapping: {
        [uid]: 'mapping',
        'forward-request': async ({ configuration: receivedIConfiguration, context, mapping: receivedMapping, match: receivedMatch, request }) => {
          assert.strictEqual(receivedIConfiguration[$configuration][uid], 'configuration')
          assert.strictEqual(receivedMapping[uid], 'mapping')
          assert.strictEqual(receivedMatch[uid], 'match')
          assert.strictEqual(context && typeof context, 'object')
          assert.strictEqual(request.method, 'GET')
          assert.strictEqual(request.url, http.urls.echos)
          assert.strictEqual(request.headers['x-status-code'], '200')
          assert.strictEqual(request.headers.Cookie, 'name=value;')
          request.headers.Cookie = 'a=b;c=d;'
        }
      },
      configuration: { [uid]: 'configuration' },
      match: { [uid]: 'match' }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers.Cookie, 'a=b;c=d;')
      }))
    )

    it('manipulates response headers (forward-response)', () => {
      mockRequire('/url.forward-response.js', ({ configuration: receivedIConfiguration, context, mapping: receivedMapping, match: receivedMatch, headers }) => {
        assert.strictEqual(receivedIConfiguration[$configuration][uid], 'configuration')
        assert.strictEqual(receivedMapping[uid], 'mapping')
        assert.strictEqual(receivedMatch[uid], 'match')
        assert.strictEqual(context && typeof context, 'object')
        assert.strictEqual(headers['x-status-code'], '200')
        assert.strictEqual(headers.Cookie, 'name=value;')
        headers.Cookie = 'a=b;c=d;'
      })
      return handle({
        request: {
          method: 'GET',
          url: http.urls.echos,
          headers: {
            'x-status-code': 200,
            Cookie: 'name=value;'
          }
        },
        mapping: {
          [uid]: 'mapping',
          'forward-response': '/url.forward-response.js'
        },
        configuration: { [uid]: 'configuration' },
        match: { [uid]: 'match' }
      })
        .then(({ promise, response }) => promise.then(value => {
          assert.strictEqual(value, undefined)
          assert.strictEqual(response.statusCode, 200)
          assert.strictEqual(response.headers.Cookie, 'a=b;c=d;')
        }))
    })

    it('provides a unique context to link forward-request and forward-response', () => {
      let contextId = 0
      const checks = {}
      const mapping = {
        'forward-request': ({ context, request }) => {
          assert.strictEqual(context.id, undefined)
          context.id = ++contextId
          context.requestId = request.headers['x-id']
          assert.ok(context.requestId)
          assert.strictEqual(checks[context.id], undefined)
          checks[context.id] = context.requestId
        },
        'forward-response': ({ context }) => {
          assert.ok(context.id !== undefined)
          assert.ok(context.requestId !== undefined)
          assert.strictEqual(checks[context.id], context.requestId)
        }
      }
      return Promise.all([
        handle({
          request: {
            method: 'GET',
            url: http.urls.echos,
            headers: {
              'x-status-code': 200,
              'x-id': 1
            }
          },
          mapping
        }).then(({ promise }) => promise),
        handle({
          request: {
            method: 'GET',
            url: http.urls.echos,
            headers: {
              'x-status-code': 200,
              'x-id': 2
            }
          },
          mapping
        }).then(({ promise }) => promise)
      ])
    })
  })

  describe('internal redirection', () => {
    it('enables internal redirection through the forward-response hook', () => {
      return handle({
        request: {
          method: 'GET',
          url: http.urls.echos,
          headers: {
            'x-status-code': 200
          }
        },
        mapping: {
          [uid]: 'mapping',
          'forward-response': () => {
            return 'test'
          }
        },
        configuration: { [uid]: 'configuration' },
        match: { [uid]: 'match' }
      })
        .then(({ promise, response }) => promise.then(value => {
          assert.strictEqual(value, 'test')
          assert.ok(response.isInitial()) // Not yet answered
        }))
    })

    it('forbids internal redirection when method is not GET or HEAD', () => {
      return handle({
        request: {
          method: 'POST',
          url: http.urls.echos,
          headers: {
            'x-status-code': 200
          },
          body: 'Hello World'
        },
        mapping: {
          [uid]: 'mapping',
          'forward-response': () => {
            return 'test'
          }
        },
        configuration: { [uid]: 'configuration' },
        match: { [uid]: 'match' }
      })
        .then(({ promise, response }) => promise.then(notExpected, reason => {
          assert.ok(!!reason)
        }))
    })
  })

  describe('HTTP/2 support', () => {
    it('filters out forbidden headers', () => handle({
      configuration: {
        http2: true
      },
      request: {
        method: 'POST',
        url: http.urls.echos,
        headers: {
          ':method': 'POST',
          'x-status-code': 200
        },
        body: 'Hello World!'
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.toString(), 'Hello World!')
        assert.ok(!response.headers[':method'])
        assert.ok(!response.headers.connection)
      }))
    )
  })

  describe('redirect', () => {
    const redirectCodes = [300, 301, 302, 303, 307, 308]

    redirectCodes.forEach(statusCode => it(`ignore redirects (default - ${statusCode})`, () => handle({
      request: {
        method: 'GET',
        url: http.urls.echos,
        headers: {
          'x-status-code': 301,
          location: '/test'
        }
      },
      mapping: {
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 301)
        assert.strictEqual(response.headers.location, '/test')
      }))
    ))

    it('changes the location URL to absolute if relative', () => handle({
      request: {
        method: 'GET',
        url: http.urls.echos,
        headers: {
          'x-status-code': 301,
          location: '/test'
        }
      },
      mapping: {
        'absolute-location': true
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.headers.location, 'https://www.mocked.com/test')
      }))
    )

    it('does not change the location URL if absolute', () => handle({
      request: {
        method: 'GET',
        url: http.urls.echos,
        headers: {
          'x-status-code': 301,
          location: 'http://my.website/test'
        }
      },
      mapping: {
        'absolute-location': true
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.headers.location, 'http://my.website/test')
      }))
    )
  })
})
