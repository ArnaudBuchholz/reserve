'use strict'

const assert = require('./assert')
const { check, mock } = require('../../index')

const reconfigure = {
  async redirect ({ configuration, request, response }) {
    await configuration.setMappings([], request, 100)
    response.writeHead(200, {
      'content-type': 'text/plain'
    })
    response.end('OK')
  }
}

const defaultConfigurationPromise = check({
  handlers: { reconfigure },
  mappings: [{
    method: 'GET',
    match: '/blocking',
    custom: () => new Promise(() => {}) // blocked
  }, {
    method: 'GET',
    match: '/non-holding',
    'exclude-from-holding-list': true,
    custom: () => new Promise(() => {}) // blocked
  }, {
    method: 'GET',
    match: '/reconfigure',
    reconfigure: true
  }, {
    method: 'GET',
    match: '/hello',
    custom: async (request, response) => {
      response.writeHead(200, {
        'content-type': 'text/plain'
      })
      response.end('Hello')
    }
  }]
})

describe('#39 setMapings blocked by long request', () => {
  let mocked
  beforeEach(async () => { mocked = await mock(await defaultConfigurationPromise) })

  it('detects blocked situation after a timeout', () => {
    mocked.request('GET', '/blocking')
    mocked.request('GET', '/non-holding')
    return Promise.all([
      mocked.request('GET', '/hello'),
      mocked.request('GET', '/reconfigure'),
      mocked.request('GET', '/hello')
    ])
      .then(responses => {
        assert(() => responses[0].toString() === 'Hello')
        assert(() => responses[1].statusCode === 500) // failed
        assert(() => responses[2].toString() === 'Hello')
        return mocked.request('GET', '/hello')
      })
      .then(response => {
        assert(() => response.toString() === 'Hello')
      })
  })

  it('permits reconfiguration on blocking requests using exclude-from-holding-list', () => {
    mocked.request('GET', '/non-holding')
    return Promise.all([
      mocked.request('GET', '/hello'),
      mocked.request('GET', '/reconfigure')
    ])
      .then(responses => {
        assert(() => responses[0].toString() === 'Hello')
        assert(() => responses[1].toString() === 'OK')
      })
  })
})
