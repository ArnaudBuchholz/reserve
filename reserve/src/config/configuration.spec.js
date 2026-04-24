'use strict'

const { describe, it, beforeEach } = require('mocha')
const assert = require('assert')
const { notExpected } = require('test-tools')
const { join } = require('path')
const { read, check } = require('./configuration')
const { $customCallback, $mappingMatch } = require('../symbols')

const shouldFail = promise => promise.then(notExpected, () => {
  assert.ok(true) // expected
})

async function okHandler () {
  return 'OK'
}

describe('config/configuration', () => {
  describe('configuration.read', () => {
    beforeEach(() => {
      process.mockCwd('/')
    })

    it('reads a configuration', () => {
      return read('reserve.json')
        .then(configuration => {
          assert.strictEqual(configuration.port, 3475)
          assert.strictEqual(configuration.mappings.length, 1)
          assert.strictEqual(configuration.mappings[0].match, '/(.*)')
          assert.strictEqual(configuration.mappings[0].file, '/$1')
          assert.strictEqual(configuration.mappings[0].cwd, '/')
        })
    })

    it('reads a configuration and extends it (also documents cwd)', () => {
      return read('/folder/reserve.json')
        .then(configuration => {
          assert.strictEqual(configuration.port, 3475)
          assert.ok(configuration.ssl)
          assert.strictEqual(configuration.mappings.length, 2)
          assert.strictEqual(configuration.mappings[0].match, '/folder/.*')
          assert.strictEqual(configuration.mappings[0].url, 'https://secured.com/$1')
          assert.strictEqual(configuration.mappings[0].cwd, '/folder')
          // Extended mappings have a lower priority
          assert.strictEqual(configuration.mappings[1].match, '/(.*)')
          assert.strictEqual(configuration.mappings[1].file, '/$1')
          assert.strictEqual(configuration.mappings[1].cwd, '/')
        })
    })

    it('reads a configuration and extends it (relative path)', () => {
      return read('/folder/reserve-with-another-port.json')
        .then(configuration => {
          assert.strictEqual(configuration.port, 8080)
          assert.ok(configuration.ssl)
          assert.strictEqual(configuration.mappings.length, 2)
          assert.strictEqual(configuration.mappings[0].match, '/folder/.*')
          assert.strictEqual(configuration.mappings[0].url, 'https://secured.com/$1')
          assert.strictEqual(configuration.mappings[0].cwd, '/folder')
          // Extended mappings have a lower priority
          assert.strictEqual(configuration.mappings[1].match, '/(.*)')
          assert.strictEqual(configuration.mappings[1].file, '/$1')
          assert.strictEqual(configuration.mappings[1].cwd, '/')
        })
    })

    it('handles error (invalid extend)', () => shouldFail(read('/folder/invalid-extend.json')))
    it('handles error (invalid json)', () => shouldFail(read('/folder/index.html')))
    it('handles error (no file)', () => shouldFail(read('/folder/not-found.json')))
  })

  describe('configuration.check', () => {
    const invalidConfigurations = {
      true: true,
      false: false,
      'empty string': '',
      'json string': JSON.stringify({}),
      function: shouldFail,
      symbol: Symbol('test'),
      zero: 0,
      number: 42,
      float: 42.3,
      null: null
    }

    Object.keys(invalidConfigurations).forEach(description => {
      it(`rejects invalid type (${description})`, () => shouldFail(check(invalidConfigurations[description])))
    })

    it('applies defaults', () => {
      return check({})
        .then(configuration => {
          assert.strictEqual(typeof configuration.port, 'number')
          assert.strictEqual(configuration.hostname, undefined)
          assert.strictEqual(configuration.mappings.length, 2)
          assert.strictEqual(configuration.listeners.length, 0)
        })
    })

    it('returns a different object', () => {
      return check({})
        .then(initialConfiguration => check(initialConfiguration)
          .then(checkedConfiguration => {
            assert.notStrictEqual(initialConfiguration, checkedConfiguration)
          })
        )
    })

    it('loads ssl info', () => {
      return read('/folder/reserve.json')
        .then(check)
        .then(configuration => {
          assert.strictEqual(configuration.ssl.key, 'privatekey')
          assert.strictEqual(configuration.ssl.cert, 'certificate')
          assert.strictEqual(configuration.protocol, 'https')
        })
    })

    it('applies global rate-limit to mappings', () => {
      return check({
        'rate-limit': {
          limit: 5,
          windowMs: 2000
        },
        mappings: [{
          status: 204
        }]
      })
        .then(configuration => {
          assert.deepStrictEqual(configuration.mappings[0]['rate-limit'], {
            algorithm: 'fixed-window',
            limit: 5,
            windowMs: 2000,
            key: { type: 'ip' },
            whitelist: [],
            blacklist: []
          })
        })
    })

    it('merges mapping rate-limit with global rate-limit', () => {
      return check({
        'rate-limit': {
          algorithm: 'fixed-window',
          limit: 5,
          windowMs: 2000,
          key: {
            type: 'header',
            name: 'x-api-key'
          },
          whitelist: ['trusted-client']
        },
        mappings: [{
          status: 204,
          'rate-limit': {
            limit: 2,
            key: {
              name: 'authorization'
            },
            blacklist: ['blocked-client']
          }
        }]
      })
        .then(configuration => {
          assert.deepStrictEqual(configuration.mappings[0]['rate-limit'], {
            algorithm: 'fixed-window',
            limit: 2,
            windowMs: 2000,
            key: {
              type: 'header',
              name: 'authorization'
            },
            whitelist: ['trusted-client'],
            blacklist: ['blocked-client']
          })
        })
    })

    it('merges mapping rate-limit key over global settings when global key is missing', () => {
      return check({
        'rate-limit': {
          limit: 5,
          windowMs: 2000
        },
        mappings: [{
          status: 204,
          'rate-limit': {
            key: {
              type: 'header',
              name: 'authorization'
            }
          }
        }]
      })
        .then(configuration => {
          assert.deepStrictEqual(configuration.mappings[0]['rate-limit'].key, {
            type: 'header',
            name: 'authorization'
          })
        })
    })

    it('keeps global rate-limit key when mapping key is missing', () => {
      return check({
        'rate-limit': {
          limit: 5,
          windowMs: 2000,
          key: {
            type: 'header',
            name: 'x-api-key'
          }
        },
        mappings: [{
          status: 204,
          'rate-limit': {
            limit: 3
          }
        }]
      })
        .then(configuration => {
          assert.deepStrictEqual(configuration.mappings[0]['rate-limit'].key, {
            type: 'header',
            name: 'x-api-key'
          })
        })
    })

    it('merges rate-limit options without key settings', () => {
      return check({
        'rate-limit': {
          limit: 5,
          windowMs: 2000
        },
        mappings: [{
          status: 204,
          'rate-limit': {
            limit: 3
          }
        }]
      })
        .then(configuration => {
          assert.deepStrictEqual(configuration.mappings[0]['rate-limit'].key, {
            type: 'ip'
          })
        })
    })

    it('applies disabled global rate-limit to mappings', () => {
      return check({
        'rate-limit': false,
        mappings: [{
          status: 204
        }]
      })
        .then(configuration => {
          assert.strictEqual(configuration.mappings[0]['rate-limit'], false)
        })
    })

    it('applies enabled global rate-limit defaults to mappings', () => {
      return check({
        'rate-limit': true,
        mappings: [{
          status: 204
        }]
      })
        .then(configuration => {
          assert.deepStrictEqual(configuration.mappings[0]['rate-limit'], {
            algorithm: 'fixed-window',
            limit: 10,
            windowMs: 60000,
            key: { type: 'ip' },
            whitelist: [],
            blacklist: []
          })
        })
    })

    it('lets mapping disable global rate-limit', () => {
      return check({
        'rate-limit': {
          limit: 5,
          windowMs: 2000
        },
        mappings: [{
          status: 204,
          'rate-limit': false
        }]
      })
        .then(configuration => {
          assert.strictEqual(configuration.mappings[0]['rate-limit'], false)
        })
    })

    it('lets mapping enable its own rate-limit over global settings', () => {
      return check({
        'rate-limit': {
          limit: 5,
          windowMs: 2000
        },
        mappings: [{
          status: 204,
          'rate-limit': true
        }]
      })
        .then(configuration => {
          assert.deepStrictEqual(configuration.mappings[0]['rate-limit'], {
            algorithm: 'fixed-window',
            limit: 10,
            windowMs: 60000,
            key: { type: 'ip' },
            whitelist: [],
            blacklist: []
          })
        })
    })

    it('uses mapping rate-limit object when global rate-limit is true', () => {
      return check({
        'rate-limit': true,
        mappings: [{
          status: 204,
          'rate-limit': {
            limit: 3,
            windowMs: 1500
          }
        }]
      })
        .then(configuration => {
          assert.deepStrictEqual(configuration.mappings[0]['rate-limit'], {
            algorithm: 'fixed-window',
            limit: 3,
            windowMs: 1500,
            key: { type: 'ip' },
            whitelist: [],
            blacklist: []
          })
        })
    })

    it('uses mapping rate-limit object when global rate-limit is false', () => {
      return check({
        'rate-limit': false,
        mappings: [{
          status: 204,
          'rate-limit': {
            limit: 4,
            windowMs: 2500
          }
        }]
      })
        .then(configuration => {
          assert.deepStrictEqual(configuration.mappings[0]['rate-limit'], {
            algorithm: 'fixed-window',
            limit: 4,
            windowMs: 2500,
            key: { type: 'ip' },
            whitelist: [],
            blacklist: []
          })
        })
    })

    describe('http2', () => {
      it('defaults http2 to false', () => {
        return read('/reserve.json')
          .then(configuration => check({ ...configuration }))
          .then(configuration => {
            assert.strictEqual(configuration.http2, false)
          })
      })

      it('validates http2', () => {
        return read('/folder/reserve.json')
          .then(configuration => check({ ...configuration, http2: 'abc' }))
          .then(notExpected, reason => assert.ok(!!reason))
      })

      it('supports unsecured http2', () => {
        return read('/reserve.json')
          .then(configuration => check({ ...configuration, http2: true }))
          .then(configuration => {
            assert.strictEqual(configuration.protocol, 'http')
          })
      })

      it('supports secured http2', () => {
        return read('/folder/reserve.json')
          .then(configuration => check({ ...configuration, http2: true }))
          .then(configuration => {
            assert.strictEqual(configuration.ssl.key, 'privatekey')
            assert.strictEqual(configuration.ssl.cert, 'certificate')
            assert.strictEqual(configuration.protocol, 'https')
          })
      })
    })

    describe('mappings', () => {
      it('validates handlers used', () => shouldFail(check({
        mappings: [{
          match: '(.*)',
          invalid: '$1'
        }]
      })))

      it('allows optional match', () => check({
        mappings: [{
          file: '$1'
        }]
      })
        .then(configuration => {
          assert.strictEqual(typeof configuration.mappings[0][$mappingMatch], 'function')
        })
      )

      const invalidMatches = [
        true,
        false,
        0,
        1,
        {}
      ]

      invalidMatches.forEach(invalidMatch => {
        it(`validates match (${JSON.stringify(invalidMatch)})`, () => shouldFail(check({
          mappings: [{
            match: invalidMatch,
            file: '$1'
          }]
        })))
      })

      it('validates match (function)', () => shouldFail(check({
        mappings: [{
          match: shouldFail,
          file: '$1'
        }]
      })))

      it('validates match (Symbol)', () => shouldFail(check({
        mappings: [{
          match: Symbol('test'),
          file: '$1'
        }]
      })))

      it('validates invert-match', () => check({
        mappings: [{
          match: '^/',
          'invert-match': true,
          file: '$1'
        }]
      })
        .then(configuration => {
          assert.strictEqual(configuration.mappings[0]['invert-match'], true)
        })
      )

      const invalidInvertMatches = [
        false,
        0,
        1,
        {}
      ]

      invalidInvertMatches.forEach(invalidInvertMatch => {
        it(`validates invert-match (${JSON.stringify(invalidInvertMatch)})`, () => shouldFail(check({
          mappings: [{
            match: '^/',
            'invert-match': invalidInvertMatch,
            file: '$1'
          }]
        })))
      })

      it('validates invert-match (function)', () => shouldFail(check({
        mappings: [{
          match: '^/',
          'invert-match': shouldFail,
          file: '$1'
        }]
      })))

      it('validates invert-match (Symbol)', () => shouldFail(check({
        mappings: [{
          match: '^/',
          'invert-match': Symbol('test'),
          file: '$1'
        }]
      })))

      it('validates if-match (function)', () => check({
        mappings: [{
          match: '^/',
          'if-match': shouldFail,
          file: '$1'
        }]
      })
        .then(configuration => {
          assert.strictEqual(configuration.mappings[0]['if-match'], shouldFail)
        })
      )

      const invalidIfMatches = [
        true,
        false,
        0,
        1,
        {},
        'require-is-not-allowed'
      ]

      invalidIfMatches.forEach(invalidIfMatch => {
        it(`validates invert-match (${JSON.stringify(invalidIfMatch)})`, () => shouldFail(check({
          mappings: [{
            match: '^/',
            'if-match': invalidIfMatch,
            file: '$1'
          }]
        })))
      })

      it('validates invert-match (Symbol)', () => shouldFail(check({
        mappings: [{
          match: '^/',
          'if-match': Symbol('test'),
          file: '$1'
        }]
      })))

      const invalidInvertExcludeFromHoldingList = [
        false,
        0,
        1,
        {}
      ]

      invalidInvertExcludeFromHoldingList.forEach(invalidExcludeFromHoldingList => {
        it(`validates exclude-from-holding-list (${JSON.stringify(invalidExcludeFromHoldingList)})`, () => shouldFail(check({
          mappings: [{
            match: '^/',
            'exclude-from-holding-list': invalidExcludeFromHoldingList,
            file: '$1'
          }]
        })))
      })

      it('validates exclude-from-holding-list (function)', () => shouldFail(check({
        mappings: [{
          match: '^/',
          'exclude-from-holding-list': shouldFail,
          file: '$1'
        }]
      })))

      it('validates exclude-from-holding-list (Symbol)', () => shouldFail(check({
        mappings: [{
          match: '^/',
          'exclude-from-holding-list': Symbol('test'),
          file: '$1'
        }]
      })))
    })

    describe('handlers', () => {
      it('loads custom handlers using require', () => {
        return check({
          mappings: [{
            match: '(.*)',
            cwd: join(__dirname, '../../tests/mocha'),
            custom: 'custom.js'
          }]
        })
          .then(configuration => {
            assert.strictEqual(typeof configuration.mappings[0][$customCallback], 'function')
            return configuration.mappings[0][$customCallback]()
          })
      })

      it('prevents overriding of the default handlers', () => {
        return check({
          handlers: {
            file: {
              overridden: true
            }
          }
        })
          .then(configuration => {
            assert.strictEqual(typeof configuration.handlers.file.custom, 'undefined')
            assert.strictEqual(typeof configuration.handlers.file.redirect, 'function')
          })
      })

      it('allows custom handlers', () => {
        return check({
          handlers: {
            mock: {
              redirect: okHandler
            }
          },
          mappings: [{
            match: /(.*)/,
            mock: '$1'
          }]
        })
          .then(configuration => {
            assert.ok(Object.keys(configuration.handlers).length > 4)
            assert.strictEqual(typeof configuration.handlers.mock.redirect, 'function')
            return configuration.handlers.mock.redirect()
          })
          .then(value => assert.strictEqual(value, 'OK'))
      })

      it('validates custom handlers', () => shouldFail(check({
        handlers: {
          mock: {
            reidrect: okHandler
          }
        },
        mappings: [{
          match: /(.*)/,
          mock: '$1'
        }]
      })))

      it('allows injecting handlers through require', () => {
        const mockedHandler = {
          redirect: okHandler
        }
        require('mock-require')('/folder/mocked-handler', mockedHandler)
        return check({
          cwd: '/folder/',
          handlers: {
            mock: 'mocked-handler'
          },
          mappings: [{
            match: /(.*)/,
            mock: '$1'
          }]
        })
          .then(configuration => {
            assert.ok(Object.keys(configuration.handlers).length > 4)
            assert.strictEqual(typeof configuration.handlers.mock.redirect, 'function')
            return configuration.handlers.mock.redirect()
          })
          .then(value => assert.strictEqual(value, 'OK'))
      })

      it('validates injected handlers', () => {
        const mockedHandler = {
          reidrect: okHandler
        }
        require('mock-require')('invalid-handler', mockedHandler)
        return shouldFail(check({
          handlers: {
            mock: 'invalid-handler'
          },
          mappings: [{
            match: /(.*)/,
            mock: '$1'
          }]
        }))
      })

      it('injects handlers relatively to the reserve.json file (same level)', () => {
        const mockedHandler = {
          redirect: okHandler
        }
        require('mock-require')('/folder/mocked-relative-handler.js', mockedHandler)
        return read('/folder/reserve-relative-handler.json')
          .then(check)
      })

      it('injects handlers relatively to the reserve.json file (parent)', () => {
        const mockedHandler = {
          redirect: okHandler
        }
        require('mock-require')('/mocked-parent-handler.js', mockedHandler)
        return read('/folder/reserve-parent-handler.json')
          .then(check)
      })

      it('injects absolute handlers', () => {
        const mockedHandler = {
          redirect: okHandler
        }
        require('mock-require')('/mocked-absolute-handler', mockedHandler)
        return read('/folder/reserve-absolute-handler.json')
          .then(check)
      })
    })

    describe('listeners', () => {
      const invalidListenersList = [
        true,
        false,
        0,
        1,
        {},
        ''
      ]

      invalidListenersList.forEach(invalidListeners => {
        it(`validates listeners (${JSON.stringify(invalidListeners)})`, () => shouldFail(check({
          listeners: invalidListeners
        })))
      })

      it('validates listeners (function)', () => shouldFail(check({
        listeners: shouldFail
      })))

      it('validates listeners (Symbol)', () => shouldFail(check({
        listeners: Symbol('test')
      })))

      const invalidListenerValues = [
        true,
        false,
        0,
        1,
        {},
        ''
      ]

      invalidListenerValues.forEach(invalidListener => {
        it(`validates listener values (${JSON.stringify(invalidListener)})`, () => shouldFail(check({
          listeners: [invalidListener]
        })))
      })

      it('validates listener values (Symbol)', () => shouldFail(check({
        listeners: [Symbol('test')]
      })))

      it('allows injecting listeners through require', () => {
        require('mock-require')('/mocked-listener', shouldFail)
        return check({
          cwd: '/',
          listeners: ['mocked-listener']
        })
          .then(configuration => {
            assert.strictEqual(configuration.listeners[0], shouldFail)
          })
      })
    })
  })
})
