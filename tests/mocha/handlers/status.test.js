'use strict'

const assert = require('../assert')
const mime = require('../../../detect/mime')
const Response = require('../Response')
const statusHandler = require('../../../handlers/status')

const textMimeType = mime.getType('text')

describe('handlers/status', () => {
  it('returns a promise', () => {
    const response = new Response()
    const result = statusHandler.redirect({ response, redirect: 404 })
    assert(() => typeof result.then === 'function')
  })

  it('sends a generic response for knonw codes', () => {
    const response = new Response()
    return statusHandler.redirect({ response, redirect: 404 })
      .then(value => {
        assert(() => value === undefined)
        assert(() => response.statusCode === 404)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.toString() === 'Not found')
      })
  })

  it('sends an empty response for unknonw codes', () => {
    const response = new Response()
    return statusHandler.redirect({ response, redirect: 418 })
      .then(value => {
        assert(() => value === undefined)
        assert(() => response.statusCode === 418)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.toString() === '')
      })
  })
})
