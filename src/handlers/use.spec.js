'use strict'

const mockRequire = require('mock-require')
const { assert } = require('test-tools')
const { Request, Response } = require('../index')
const useHandler = require('./use')

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
    const myRequest = Symbol('myRequest')
    const dispatchedRequest = new Request()
    dispatchedRequest[myRequest] = true
    const myResponse = Symbol('myResponse')
    const dispatchedResponse = new Response()
    dispatchedResponse[myResponse] = true
    let executed
    const mapping = {
      use: function () {
        return function (request, response, next) {
          assert(() => request[myRequest] === true)
          assert(() => response[myResponse] === true)
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

  it('detects the response end even if next is not called (synchronous)', async () => {
    const dispatchedRequest = new Request()
    const dispatchedResponse = new Response()
    const mapping = {
      use: function () {
        return function (request, response, next) {
          response.end()
        }
      }
    }
    await useHandler.validate(mapping)
    return useHandler.redirect({ mapping, request: dispatchedRequest, response: dispatchedResponse })
  })

  it('detects the response end even if next is not called (asynchronous)', async () => {
    const dispatchedRequest = new Request()
    const dispatchedResponse = new Response()
    const mapping = {
      use: function () {
        return function (request, response, next) {
          setTimeout(() => response.end(), 50)
        }
      }
    }
    await useHandler.validate(mapping)
    return useHandler.redirect({ mapping, request: dispatchedRequest, response: dispatchedResponse })
  })

  it('does not prevent the override of response.end', async () => {
    const dispatchedRequest = new Request()
    const dispatchedResponse = new Response()
    let myEndWasCalled = false
    const myEnd = function () {
      myEndWasCalled = true
    }
    const mapping = {
      use: function () {
        return function (request, response, next) {
          response.end = myEnd
          response.end()
        }
      }
    }
    await useHandler.validate(mapping)
    await useHandler.redirect({ mapping, request: dispatchedRequest, response: dispatchedResponse })
    assert(() => myEndWasCalled)
    assert(() => dispatchedResponse.end === myEnd)
  })
})
