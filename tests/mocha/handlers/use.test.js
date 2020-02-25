'use strict'

const mockRequire = require('mock-require')
const assert = require('../assert')
const Request = require('../../../mock/Request')
const Response = require('../../../mock/Response')
const useHandler = require('../../../handlers/use')

describe('handlers/use', () => {
  it('rejects invalid signatures (no next)', () => useHandler.validate({
    use: function () {
      /* istanbul ignore next */ // Won't be executed
      return function (request, response) {}
    }
  })
    .then(assert.notExpected, function (reason) {
      assert(() => reason instanceof Error)
    })
  )

  it('rejects invalid signatures (err)', () => useHandler.validate({
    use: function () {
      /* istanbul ignore next */ // Won't be executed
      return function (err, request, response, next) {
        throw err
      }
    }
  })
    .then(assert.notExpected, function (reason) {
      assert(() => reason instanceof Error)
    })
  )

  it('loads module and builds the middleware with the provided options', async () => {
    const expectedOptions = {}
    let executed
    mockRequire('test-middleware', (options) => {
      assert(() => options === expectedOptions)
      executed = true
      /* istanbul ignore next */ // Won't be executed
      return function (request, response, next) {}
    })
    await useHandler.validate({
      use: 'test-middleware',
      options: expectedOptions
    })
    assert(() => executed)
  })

  it('executes the middleware', async () => {
    const dispatchedRequest = new Request()
    const dispatchedResponse = new Response()
    let executed
    const mapping = {
      use: function () {
        return function (request, response, next) {
          assert(() => request === dispatchedRequest)
          assert(() => response === dispatchedResponse)
          assert(() => typeof next === 'function')
          executed = true
          next()
        }
      }
    }
    await useHandler.validate(mapping)
    await useHandler.redirect({ mapping, request: dispatchedRequest, response: dispatchedResponse })
    assert(() => executed)
  })

  it('forward the middleware error (use of next)', async () => {
    const dispatchedRequest = new Request()
    const dispatchedResponse = new Response()
    const error = new Error()
    const mapping = {
      use: function () {
        return function (request, response, next) {
          next(error)
        }
      }
    }
    await useHandler.validate(mapping)
    useHandler.redirect({ mapping, request: dispatchedRequest, response: dispatchedResponse })
      .then(assert.notExpected, reason => assert(() => reason === error))
  })

  it('forward the middleware error (exception)', async () => {
    const dispatchedRequest = new Request()
    const dispatchedResponse = new Response()
    const error = new Error()
    const mapping = {
      use: function () {
        return function (request, response, next) {
          throw error
        }
      }
    }
    await useHandler.validate(mapping)
    return useHandler.redirect({ mapping, request: dispatchedRequest, response: dispatchedResponse })
      .then(assert.notExpected, reason => assert(() => reason === error))
  })
})
