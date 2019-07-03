'use strict'

const assert = require('./assert')
const { read, check } = require('../../configuration')

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

    it('reads a configuration and extends it', () => {
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

    const shouldFail = promise => promise.then(() => {
      assert(() => false) // Not expected
    }, () => {
      assert(() => true) // expected
    })

    it('handles error (invalid extend)', () => {
      return shouldFail(read('/folder/invalid-extend.json'))
    })

    it('handles error (invalid json)', () => {
      return shouldFail(read('/folder/index.html'))
    })

    it('handles error (no file)', () => {
      return shouldFail(read('/folder/not-found.json'))
    })
  })

  describe('configuration.check', () => {
    it('applies defaults', () => {
      return check({})
        .then(configuration => {
          assert(() => typeof configuration.port === 'number')
          assert(() => configuration.hostname && typeof configuration.hostname === 'string')
          assert(() => configuration.mappings.length === 2)
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
  })
})
