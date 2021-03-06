'use strict'

const assert = require('./assert')
const { read, check } = require('../../configuration')

const { $customCallback } = require('../../symbols')

const shouldFail = promise => promise.then(assert.notExpected, () => {
  assert(() => true) // expected
})

async function okHandler () {
  return 'OK'
}

describe('configuration', () => {
  describe('configuration.read', () => {
    process.mockCwd('/')

    it('reads a configuration', () => {
      return read('reserve.json')
        .then(configuration => {
          assert(() => configuration.port === 3475)
          assert(() => configuration.mappings.length === 1)
          assert(() => configuration.mappings[0].match === '/(.*)')
          assert(() => configuration.mappings[0].file === '/$1')
          assert(() => configuration.mappings[0].cwd === '/')
        })
    })

    it('reads a configuration and extends it (also documents cwd)', () => {
      return read('/folder/reserve.json')
        .then(configuration => {
          assert(() => configuration.port === 3475)
          assert(() => configuration.ssl !== undefined)
          assert(() => configuration.mappings.length === 2)
          assert(() => configuration.mappings[0].match === '/folder/.*')
          assert(() => configuration.mappings[0].url === 'https://secured.com/$1')
          assert(() => configuration.mappings[0].cwd === '/folder')
          // Extended mappings have a lower priority
          assert(() => configuration.mappings[1].match === '/(.*)')
          assert(() => configuration.mappings[1].file === '/$1')
          assert(() => configuration.mappings[1].cwd === '/')
        })
    })

    it('reads a configuration and extends it (relative path)', () => {
      return read('/folder/reserve-with-another-port.json')
        .then(configuration => {
          assert(() => configuration.port === 220103)
          assert(() => configuration.ssl !== undefined)
          assert(() => configuration.mappings.length === 2)
          assert(() => configuration.mappings[0].match === '/folder/.*')
          assert(() => configuration.mappings[0].url === 'https://secured.com/$1')
          assert(() => configuration.mappings[0].cwd === '/folder')
          // Extended mappings have a lower priority
          assert(() => configuration.mappings[1].match === '/(.*)')
          assert(() => configuration.mappings[1].file === '/$1')
          assert(() => configuration.mappings[1].cwd === '/')
        })
    })

    it('handles error (invalid extend)', () => shouldFail(read('/folder/invalid-extend.json')))
    it('handles error (invalid json)', () => shouldFail(read('/folder/index.html')))
    it('handles error (no file)', () => shouldFail(read('/folder/not-found.json')))
  })

  describe('configuration.check', () => {
    it('applies defaults', () => {
      return check({})
        .then(configuration => {
          assert(() => typeof configuration.port === 'number')
          assert(() => configuration.hostname === undefined)
          assert(() => configuration.mappings.length === 2)
          assert(() => configuration.listeners.length === 0)
        })
    })

    it('returns a different object', () => {
      return check({})
        .then(initialConfiguration => check(initialConfiguration)
          .then(checkedConfiguration => {
            assert(() => initialConfiguration !== checkedConfiguration)
          })
        )
    })

    it('loads ssl info', () => {
      return read('/folder/reserve.json')
        .then(check)
        .then(configuration => {
          assert(() => configuration.ssl.key === 'privatekey')
          assert(() => configuration.ssl.cert === 'certificate')
          assert(() => configuration.protocol === 'https')
        })
    })

    describe('http2', () => {
      it('defaults http2 to false', () => {
        return read('/reserve.json')
          .then(configuration => check({ ...configuration }))
          .then(configuration => {
            assert(() => configuration.http2 === false)
          })
      })

      it('validates http2', () => {
        return read('/folder/reserve.json')
          .then(configuration => check({ ...configuration, http2: 'abc' }))
          .then(assert.notExpected, reason => {
            assert(() => !!reason)
          })
      })

      it('supports unsecured http2', () => {
        return read('/reserve.json')
          .then(configuration => check({ ...configuration, http2: true }))
          .then(configuration => {
            assert(() => configuration.protocol === 'http')
          })
      })

      it('supports secured http2', () => {
        return read('/folder/reserve.json')
          .then(configuration => check({ ...configuration, http2: true }))
          .then(configuration => {
            assert(() => configuration.ssl.key === 'privatekey')
            assert(() => configuration.ssl.cert === 'certificate')
            assert(() => configuration.protocol === 'https')
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
          assert(() => configuration.mappings[0].match instanceof RegExp)
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
          assert(() => configuration.mappings[0]['invert-match'] === true)
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
          assert(() => configuration.mappings[0]['if-match'] === shouldFail)
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
            cwd: __dirname,
            custom: 'custom.js'
          }]
        })
          .then(configuration => {
            assert(() => typeof configuration.mappings[0][$customCallback] === 'function')
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
            assert(() => typeof configuration.handlers.file.custom === 'undefined')
            assert(() => typeof configuration.handlers.file.redirect === 'function')
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
            assert(() => Object.keys(configuration.handlers).length > 4)
            assert(() => typeof configuration.handlers.mock.redirect === 'function')
            return configuration.handlers.mock.redirect()
          })
          .then(value => assert(() => value === 'OK'))
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
        require('mock-require')('mocked-handler', mockedHandler)
        return check({
          handlers: {
            mock: 'mocked-handler'
          },
          mappings: [{
            match: /(.*)/,
            mock: '$1'
          }]
        })
          .then(configuration => {
            assert(() => Object.keys(configuration.handlers).length > 4)
            assert(() => typeof configuration.handlers.mock.redirect === 'function')
            return configuration.handlers.mock.redirect()
          })
          .then(value => assert(() => value === 'OK'))
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
        require('mock-require')('mocked-absolute-handler', mockedHandler)
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
          listeners: ['mocked-listener']
        })
          .then(configuration => {
            assert(() => configuration.listeners[0] === shouldFail)
          })
      })
    })
  })
})
