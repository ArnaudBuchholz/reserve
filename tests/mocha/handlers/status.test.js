'use strict'

const assert = require('../assert')
const mime = require('../../../detect/mime')
const statusHandler = require('../../../handlers/status')
const handle = require('./handle')(statusHandler)

const textMimeType = mime.getType('text')

describe('handlers/status', () => {
  it('returns a promise', () => handle({
    mapping: null,
    redirect: 404
  })
    .then(({ promise }) => {
      assert(() => typeof promise.then === 'function')
    })
  )

  it('sends a generic response for knonw codes', () => handle({
    mapping: null,
    redirect: 404
  })
    .then(({ promise, response }) => promise.then(value => {
      assert(() => value === undefined)
      assert(() => response.statusCode === 404)
      assert(() => response.headers['Content-Type'] === textMimeType)
      assert(() => response.toString() === 'Not found')
    }))
  )

  it('sends an empty response for unknonw codes', () => handle({
    mapping: null,
    redirect: 418
  })
    .then(({ promise, response }) => promise.then(value => {
      assert(() => value === undefined)
      assert(() => response.statusCode === 418)
      assert(() => response.headers['Content-Type'] === textMimeType)
      assert(() => response.toString() === '')
    }))
  )

  it('can be used for redirections', () => handle({
    mapping: {
      status: 302,
      headers: {
        Location: '$1'
      }
    },
    redirect: 302,
    match: [undefined, 'https://www.npmjs.com/package/reserve']
  })
    .then(({ promise, response }) => promise.then(value => {
      assert(() => value === undefined)
      assert(() => response.statusCode === 302)
      assert(() => response.headers['Content-Type'] === textMimeType)
      assert(() => response.toString() === '')
      assert(() => response.headers.Location === 'https://www.npmjs.com/package/reserve')
    }))
  )
})
