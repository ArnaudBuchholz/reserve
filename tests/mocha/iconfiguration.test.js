'use strict'

const assert = require('./assert')
const { check } = require('../../configuration')

function checkConfiguration (configuration, mapping) {
  assert(() => configuration.handlers instanceof Object)
  assert(() => !!configuration.handlers.custom)
  assert(() => !!configuration.handlers.file)
  assert(() => !!configuration.handlers.status)
  assert(() => !!configuration.handlers.test)
  assert(() => !!configuration.handlers.url)
  assert(() => Array.isArray(configuration.mappings))
  assert(() => configuration.mappings[0] === mapping)
}

const handler = {
  async validate (mapping, configuration) {
    checkConfiguration(configuration, mapping)
    if (mapping.ko) {
      throw new Error('Invalid configuration')
    }
    assert(() => mapping.test === '$1')
    assert(() => mapping.match instanceof RegExp)
    mapping.ok = true
  },

  async redirect ({ configuration, mapping, redirect }) {
    checkConfiguration(configuration, mapping)
    return 'OK'
  }
}

describe('iconfiguration', () => {
  describe('validate', () => {
    it('passes mapping and configuration to the validate method', () => {
      return check({
        handlers: {
          test: handler
        },
        mappings: [{
          match: '(.*)',
          test: '$1'
        }]
      })
        .then(configuration => {
          assert(() => configuration.mappings[0].ok)
        })
    })

    it('invalidates mapping using exception', () => {
      return check({
        handlers: {
          test: handler
        },
        mappings: [{
          ko: true
        }]
      })
        .then(assert.notExpected, reason => {
          assert(() => reason instanceof Error)
        })
    })
  })

  describe('redirect', () => {

  })
})
