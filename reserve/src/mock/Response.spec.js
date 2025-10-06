'use strict'

const { describe, it } = require('mocha')
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

  describe('getHeaders API', () => {
    it('returns the headers values', () => {
      const response = new Response()
      response.setHeader('test', 12)
      assert.deepStrictEqual(response.getHeaders(), { test: '12' })
    })

    it('defaults when no header is set', () => {
      const response = new Response()
      assert.deepStrictEqual(response.getHeaders(), {})
    })
  })
})
