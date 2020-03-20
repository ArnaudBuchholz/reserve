'use strict'

const assert = require('../assert')
const mime = require('../../../detect/mime')
const Response = require('../../../mock/Response')
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
      .then(async value => {
        assert(() => value === undefined)
        await response.waitForFinish()
        assert(() => response.statusCode === 404)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.toString() === 'Not found')
      })
  })

  it('sends an empty response for unknonw codes', () => {
    const response = new Response()
    return statusHandler.redirect({ response, redirect: 418 })
      .then(async value => {
        assert(() => value === undefined)
        await response.waitForFinish()
        assert(() => response.statusCode === 418)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.toString() === '')
      })
  })

  it('can be used for redirections', () => {
    const response = new Response()
    const mapping = {
      headers: {
        Location: '$1'
      }
    }
    const match = [undefined, 'https://www.npmjs.com/package/reserve']
    return statusHandler.redirect({ mapping, match, response, redirect: 302 })
      .then(async value => {
        assert(() => value === undefined)
        await response.waitForFinish()
        assert(() => response.statusCode === 302)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.toString() === '')
        assert(() => response.headers.Location === 'https://www.npmjs.com/package/reserve')
      })
  })
})
