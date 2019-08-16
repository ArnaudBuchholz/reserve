'use strict'

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
        assert(() => false)
      }, reason => {
        assert(() => reason.message === 'KO')
      })
  })
})
