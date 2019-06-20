'use strict'

require('../fs-mock')

const assert = require('../assert')
const Request = require('../Request')
const Response = require('../Response')
const fileHandler = require('../../../handlers/file')

describe('handlers/file', () => {
  it('returns a promise', () => {
    const request = new Request('GET', '/file')
    const response = new Response()
    const result = fileHandler.redirect({
      request,
      response,
      mapping: {
        _path: '/'
      },
      redirect: 'file'
    })
    assert(() => typeof result.then === 'function')
  })
})
