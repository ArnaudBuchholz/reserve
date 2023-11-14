'use strict'

const assert = require('assert')
const Response = require('./Response')

describe('mock/Response', () => {
  describe('getHeader API', () => {
    it('returns the header value', () => {
      const response = new Response()
      response.setHeader('test', 12)
      assert.strictEqual(response.getHeader('test'), '12')
    })

    it('defaults the header value if not set', () => {
      const response = new Response()
      assert.strictEqual(response.getHeader('test'), '')
    })
  })
})
