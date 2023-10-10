'use strict'

const { assert } = require('test-tools')
const { Request, Response, check, log, mock } = require('./index')

function checkConfiguration (configuration, mapping) {
  assert(() => configuration.handlers instanceof Object)
  assert(() => !!configuration.handlers.custom)
  assert(() => !!configuration.handlers.file)
  assert(() => !!configuration.handlers.status)
  assert(() => !!configuration.handlers.test)
  assert(() => !!configuration.handlers.url)
  assert(() => Array.isArray(configuration.mappings))
  assert(() => configuration.mappings.includes(mapping))
  assert(() => configuration.protocol.startsWith('http'))
  // Read-only handlers
  delete configuration.handlers.custom
  assert(() => !!configuration.handlers.custom)
  const fileHandler = configuration.handlers.file
  configuration.handlers.file = configuration.handlers.custom
  assert(() => configuration.handlers.file === fileHandler)
  const fileHandlerRedirect = fileHandler.redirect
  try {
    fileHandler.redirect = 0
  } catch (e) {
    assert(() => e instanceof TypeError)
  }
  assert(() => fileHandler.redirect === fileHandlerRedirect)
  // Read-only mapping list
  configuration.mappings.length = 0
  assert(() => configuration.mappings.includes(mapping))
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

  async redirect ({ configuration, mapping, redirect, request, response }) {
    checkConfiguration(configuration, mapping)
    response.writeHead(200)
    let answer = 'OK'
    if (redirect === 'count') {
      answer = (++mapping.count).toString()
    }
    if (redirect === 'inject') {
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
        assert(() => configuration.mappings[0].ok)
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
      .then(assert.notExpected, reason => {
        assert(() => reason instanceof Error)
        assert(() => reason.message === 'mapping.ko')
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
        assert(() => response.statusCode === 200)
        assert(() => response.toString() === '1')
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
          assert(() => response.statusCode === 200)
          assert(() => response.headers['x-injected'] !== 'true')
        })
        assert(() => responses[0].toString() === '4')
        assert(() => responses[1].toString() === '3')
        assert(() => responses[2].toString() === 'OK')
        assert(() => responses[3].toString() === '2')
        return mocked.request('GET', 'count')
      })
      .then(response => {
        assert(() => response.statusCode === 200)
        assert(() => response.headers['x-injected'] === 'true')
        assert(() => response.toString() === '5')
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
        assert(() => response.statusCode === 200)
        assert(() => response.toString() === 'Hello World !')
      })
    )
  })
})
