'use strict'

const assert = require('assert')
const mimeTypes = require('./mime')

function test (list) {
  Object.keys(list).forEach(type => {
    const expectedMimeType = list[type]
    it(`${type} = ${expectedMimeType}`, () => {
      assert.strictEqual(mimeTypes[type], expectedMimeType)
    })
  })
}

describe('mime', () => {
  describe('in sync with mime.json', () => {
    const list = require('./mime.json')

    test(list)

    it('exposes the same number of items', () => {
      assert.strictEqual(Object.keys(mimeTypes).length, Object.keys(list).length)
    })
  })

  describe('minimal expectations', () => test({
    bin: 'application/octet-stream',
    text: 'text/plain',
    json: 'application/json'
  }))
})
