'use strict'

const { assert } = require('test-tools')
const Response = require('./Response')

describe('mock/Response', () => {
  describe('getHeader API', () => {
    it('returns the header value', () => {
      const response = new Response()
      response.setHeader('test', 12)
      assert(() => response.getHeader('test') === '12')
    })

    it('defaults the header value if not set', () => {
      const response = new Response()
      assert(() => response.getHeader('test') === '')
    })
  })
})
