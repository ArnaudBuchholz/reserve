'use strict'

const assert = require('./assert')
const { check, mock } = require('../../index')

function checkConfiguration (configuration, mapping) {
  assert(() => configuration.handlers instanceof Object)
  assert(() => !!configuration.handlers.custom)
  assert(() => !!configuration.handlers.file)
  assert(() => !!configuration.handlers.status)
  assert(() => !!configuration.handlers.test)
  assert(() => !!configuration.handlers.url)
  assert(() => Array.isArray(configuration.mappings))
  assert(() => configuration.mappings[0] === mapping)
  // Read-only handlers
  delete configuration.handlers.custom
  assert(() => !!configuration.handlers.custom)
  const fileHandler = configuration.handlers.file
  configuration.handlers.file = configuration.handlers.custom
  assert(() => configuration.handlers.file === fileHandler)
  // Read-only mappings
  configuration.mappings.length = 0
  assert(() => configuration.mappings[0] === mapping)
}

const handler = {
  async validate (mapping, configuration) {
    checkConfiguration(configuration, mapping)
    if (mapping.ko) {
      throw new Error('mapping.ko')
    }
    assert(() => mapping.test === '$1')
    assert(() => mapping.match instanceof RegExp)
    mapping.ok = true
  },

  async redirect ({ configuration, mapping, redirect, response }) {
    checkConfiguration(configuration, mapping)
    response.writeHead(200)
    response.end('OK')
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
          ko: true,
          test: '$1'
        }]
      })
        .then(assert.notExpected, reason => {
          assert(() => reason instanceof Error)
          assert(() => reason.message === 'mapping.ko')
        })
    })
  })

  describe('redirect', () => {
    let mocked

    before(async () => {
      mocked = await mock({
        handlers: {
          test: handler
        },
        mappings: [{
          match: '(.*)',
          test: '$1'
        }]
      })
    })

    it('gives access to the configuration', () => mocked.request('GET', 'test')
      .then(response => {
        assert(() => response.statusCode === 200)
        assert(() => response.toString() === 'OK')
      })
    )
  })
})
