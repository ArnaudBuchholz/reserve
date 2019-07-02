'use strict'

const assert = require('../assert')
const Request = require('../Request')
const Response = require('../Response')
const customHandler = require('../../../handlers/custom')

describe('handlers/custom', () => {
  it('returns a promise', () => {
    const request = new Request()
    const response = new Response()
    const result = customHandler.redirect({ request, response, mapping: { custom: () => {} }, match: [] })
    assert(() => typeof result.then === 'function')
  })

  it('calls the function with the proper parameters', () => {
    const request = new Request()
    const response = new Response()
    return customHandler.redirect({
      request,
      response,
      mapping: {
        custom: (receivedRequest, receivedResponse, ...additionalParameters) => {
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
        custom: () => Promise.resolve('OK')
      },
      match: []
    })
      .then(result => assert(() => result === 'OK'))
  })

  it('lets any exception flow (will be intercepted by dispatcher)', () => {
    const request = new Request()
    const response = new Response()
    let exception
    try {
      customHandler.redirect({
        request,
        response,
        mapping: {
          custom: () => {
            throw new Error('KO')
          }
        },
        match: []
      })
    } catch (e) {
      exception = e
    }
    assert(() => !!exception)
  })

  it('returns any rejected promise (will be intercepted by dispatcher)', () => {
    const request = new Request()
    const response = new Response()
    return customHandler.redirect({
      request,
      response,
      mapping: {
        custom: () => {
          return new Promise((resolve, reject) => reject(new Error('KO')))
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
})
