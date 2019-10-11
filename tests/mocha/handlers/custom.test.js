'use strict'

const mockRequire = require('mock-require')
const assert = require('../assert')
const Request = require('../Request')
const Response = require('../Response')
const customHandler = require('../../../handlers/custom')

describe('handlers/custom', () => {
  it('returns a promise', () => {
    const request = new Request()
    const response = new Response()
    const result = customHandler.redirect({ request, response, mapping: { _callback: () => {} }, match: [] })
    assert(() => typeof result.then === 'function')
  })

  it('calls the function with the proper parameters', () => {
    const request = new Request()
    const response = new Response()
    return customHandler.redirect({
      request,
      response,
      mapping: {
        _callback: (receivedRequest, receivedResponse, ...additionalParameters) => {
          assert(() => receivedRequest === request)
          assert(() => receivedResponse === response)
          assert(() => additionalParameters.length === 2)
          assert(() => additionalParameters[0] === 'first')
          assert(() => additionalParameters[1] === 'second')
        }
      },
      match: ['capturing groups are: ', 'first', 'second']
    })
  })

  it('waits for the function result if a promise', () => {
    const request = new Request()
    const response = new Response()
    return customHandler.redirect({
      request,
      response,
      mapping: {
        _callback: async () => 'OK'
      },
      match: []
    })
      .then(result => assert(() => result === 'OK'))
  })

  it('lets any exception flow (will be intercepted by dispatcher)', () => {
    const request = new Request()
    const response = new Response()
    return customHandler.redirect({
      request,
      response,
      mapping: {
        _callback: () => {
          throw new Error('KO')
        }
      },
      match: []
    })
      .then(() => {
        /* istanbul ignore next */ // We don't expect it to happen !
        assert(() => false)
      }, reason => {
        assert(() => reason.message === 'KO')
      })
  })

  it('returns any rejected promise (will be intercepted by dispatcher)', () => {
    const request = new Request()
    const response = new Response()
    return customHandler.redirect({
      request,
      response,
      mapping: {
        _callback: () => Promise.reject(new Error('KO'))
      },
      match: []
    })
      .then(() => {
        /* istanbul ignore next */ // We don't expect it to happen !
        assert(() => false)
      }, reason => {
        assert(() => reason.message === 'KO')
      })
  })

  it('implements file watching (timestamp changes)', async () => {
    const request = new Request()
    const response1 = new Response()
    const mapping = {
      cwd: '/',
      custom: 'now.js',
      watch: true
    }
    mockRequire('/now.js', (request, response) => response.end('first'))
    await customHandler.validate(mapping)
    await customHandler.redirect({
      request,
      response: response1,
      mapping,
      match: []
    })
    const timestamp1 = mapping._timestamp
    assert(() => response1.toString() === 'first')
    assert(() => timestamp1)

    const response2 = new Response()
    mockRequire('/now.js', (request, response) => response.end('second'))
    await customHandler.redirect({
      request,
      response: response2,
      mapping,
      match: []
    })
    assert(() => response2.toString() === 'second')
    assert(() => mapping._timestamp !== timestamp1)
  })

  it('implements file watching (timestamp remains the same)', async () => {
    const request = new Request()
    const response1 = new Response()
    const mapping = {
      cwd: '/',
      custom: 'not-now.js',
      watch: true
    }
    mockRequire('/not-now.js', (request, response) => response.end('first'))
    await customHandler.validate(mapping)
    await customHandler.redirect({
      request,
      response: response1,
      mapping,
      match: []
    })
    const timestamp1 = mapping._timestamp
    assert(() => response1.toString() === 'first')
    assert(() => timestamp1)

    const response2 = new Response()
    mockRequire('/not-now.js', (request, response) => response.end('second'))
    await customHandler.redirect({
      request,
      response: response2,
      mapping,
      match: []
    })
    assert(() => response2.toString() === 'first')
    assert(() => mapping._timestamp === timestamp1)
  })
})
