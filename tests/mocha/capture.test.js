'use strict'

const assert = require('./assert')
const capture = require('../../capture')
const Response = require('../../mock/Response')

function setup () {
  const response = new Response()
  const writableStream = new Response()
  const promise = capture(response, writableStream)
  return { response, writableStream, promise }
}

describe('capture', () => {
  it('fails if the response status is not 200', done => {
    const { response, promise } = setup()
    const notImplemented = 'Not implemented'
    promise
      .then(assert.notExpected, reason => {
        assert(() => reason.message === 'Invalid status')
        return response.waitForFinish()
      })
      .then(() => {
        assert(() => response.statusCode === 500)
        assert(() => response.toString() === notImplemented)
      })
      .then(done, done)
    response.writeHead(500)
    response.end(notImplemented)
  })

  it('copies response content (on write)', done => {
    const { response, writableStream, promise } = setup()
    const helloWorld = 'Hello World!'
    promise
      .then(() => {
        assert(() => writableStream.toString() === helloWorld)
      })
      .then(() => {
        assert(() => response.statusCode === 200)
        assert(() => response.toString() === helloWorld)
      })
      .then(done, done)
    response.writeHead(200)
    response.write(helloWorld)
    response.end()
  })

  it('copies response content (on end)', done => {
    const { response, writableStream, promise } = setup()
    const helloWorld = 'Hello World!'
    promise
      .then(() => {
        assert(() => writableStream.toString() === helloWorld)
      })
      .then(() => {
        assert(() => response.statusCode === 200)
        assert(() => response.toString() === helloWorld)
      })
      .then(done, done)
    response.writeHead(200)
    response.end(helloWorld)
  })
})
