'use strict'

const { describe, it, before } = require('mocha')
const assert = require('assert')
const { notExpected } = require('test-tools')
const { Request, Response, check, log, mock } = require('../index')

function checkConfiguration (configuration, mapping) {
  assert.ok(configuration.handlers instanceof Object)
  assert.ok(!!configuration.handlers.custom)
  assert.ok(!!configuration.handlers.file)
  assert.ok(!!configuration.handlers.status)
  assert.ok(!!configuration.handlers.test)
  assert.ok(!!configuration.handlers.url)
  assert.ok(Array.isArray(configuration.mappings))
  assert.ok(configuration.mappings.includes(mapping))
  assert.ok(configuration.protocol.startsWith('http'))
  // Read-only handlers
  delete configuration.handlers.custom
  assert.ok(!!configuration.handlers.custom)
  const fileHandler = configuration.handlers.file
  configuration.handlers.file = configuration.handlers.custom
  assert.strictEqual(configuration.handlers.file, fileHandler)
  const fileHandlerRedirect = fileHandler.redirect
  try {
    fileHandler.redirect = 0
  } catch (e) {
    assert.ok(e instanceof TypeError)
  }
  assert.strictEqual(fileHandler.redirect, fileHandlerRedirect)
  // Read-only mapping list
  configuration.mappings.length = 0
  assert.ok(configuration.mappings.includes(mapping))
}

const handler = {
  async validate (mapping, configuration) {
    checkConfiguration(configuration, mapping)
    if (mapping.ko) {
      throw new Error('mapping.ko')
    }
    assert.strictEqual(mapping.test, '$1')
    assert.ok(mapping.match instanceof RegExp)
    mapping.ok = true
  },

  async redirect ({ configuration, mapping, redirect, request, response }) {
    checkConfiguration(configuration, mapping)
    response.writeHead(200)
    let answer = 'OK'
    if (redirect === '/count') {
      answer = (++mapping.count).toString()
    }
    if (redirect === '/inject') {
      const mappings = configuration.mappings
      const injectedMapping = {
        match: '.*',
        custom: async (request, response) => {
          response.setHeader('x-injected', 'true')
        }
      }
      mappings.unshift(injectedMapping)
      await configuration.setMappings(mappings, request)
    }
    response.end(answer)
  }
}

describe('iconfiguration', () => {
  describe('validate', () => {
    it('passes mapping and configuration to the validate method', () => check({
      handlers: {
        test: handler
      },
      mappings: [{
        match: '(.*)',
        test: '$1'
      }]
    })
      .then(configuration => {
        assert.ok(configuration.mappings[0].ok)
      })
    )

    it('invalidates mapping using exception', () => check({
      handlers: {
        test: handler
      },
      mappings: [{
        ko: true,
        test: '$1'
      }]
    })
      .then(notExpected, reason => {
        assert.ok(reason instanceof Error)
        assert.strictEqual(reason.message, 'mapping.ko')
      })
    )
  })

  describe('redirect', () => {
    let mocked

    before(async () => {
      mocked = await mock({
        handlers: {
          test: handler
        },
        mappings: [{
          match: '.*',
          custom: async (request, response) => {
            const timeout = request.headers['x-timeout']
            if (timeout) {
              return new Promise(resolve => {
                setTimeout(resolve, parseInt(timeout, 10))
              })
            }
          }
        }, {
          match: '(.*)',
          count: 0,
          test: '$1'
        }]
      })
    })

    it('gives access to the configuration', () => mocked.request('GET', 'count')
      .then(response => {
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.toString(), '1')
      })
    )

    it('allows dynamic change of mappings (with synchronization)', () => Promise.all([
      mocked.request('GET', 'count', { 'x-timeout': 50 }),
      mocked.request('GET', 'count', { 'x-timeout': 25 }),
      mocked.request('GET', 'inject'), // Should wait for pending requests to complete
      mocked.request('GET', 'count')
    ])
      .then(responses => {
        responses.forEach(response => {
          assert.strictEqual(response.statusCode, 200)
          assert.ok(response.headers['x-injected'] !== 'true')
        })
        assert.strictEqual(responses[0].toString(), '4')
        assert.strictEqual(responses[1].toString(), '3')
        assert.strictEqual(responses[2].toString(), 'OK')
        assert.strictEqual(responses[3].toString(), '2')
        return mocked.request('GET', 'count')
      })
      .then(response => {
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers['x-injected'], 'true')
        assert.strictEqual(response.toString(), '5')
      })
    )
  })

  describe('dispatch', () => {
    let mocked

    before(async () => {
      mocked = await mock({
        mappings: [{
          match: 'dispatch',
          custom: async function (request, response) {
            const res1 = new Response()
            const res2 = new Response()
            await Promise.all([
              this.configuration.dispatch(new Request('GET', 'hello'), res1),
              this.configuration.dispatch(new Request('GET', 'world'), res2)
            ])
            response.writeHead(200, { 'content-type': 'text/plain' })
            response.write(res1.toString())
            response.write(res2.toString())
            response.end()
          }
        }, {
          match: 'hello',
          custom: async (request, response) => {
            response.writeHead(200, { 'content-type': 'text/plain' })
            response.end('Hello ')
          }
        }, {
          match: 'world',
          custom: async (request, response) => {
            response.writeHead(200, { 'content-type': 'text/plain' })
            response.end('World !')
          }
        }]
      })
      log(mocked, true)
    })

    it('enables internal dispatch', () => mocked.request('GET', 'dispatch')
      .then(response => {
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.toString(), 'Hello World !')
      })
    )
  })
})
