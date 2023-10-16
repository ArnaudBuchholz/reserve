'use strict'

const { assert, cleanRequireCache } = require('test-tools')
const mockRequire = require('mock-require')

describe('detect/mime', () => {
  let mime

  const expected = {
    text: 'text/plain',
    html: 'text/html',
    json: 'application/json'
  }

  function tests () {
    Object.keys(expected).forEach(extension => {
      const mimeType = expected[extension]
      it(`returns the expected mime type for extension .${extension}`, () => {
        assert(() => mime(extension) === mimeType)
      })
    })
  }

  describe('mime not installed', () => {
    before(() => {
      cleanRequireCache()
      mockRequire('mime', null)
      mime = require('./mime')
    })

    tests()

    after(() => {
      mockRequire.stop('mime')
      cleanRequireCache()
    })
  })

  describe('mime v1', () => {
    before(() => {
      cleanRequireCache()
      const mimeV2 = require('mime')
      cleanRequireCache()
      mockRequire('mime', {
        lookup: extension => mimeV2.getType(extension)
      })
      mime = require('./mime')
    })

    tests()

    after(() => {
      mockRequire.stop('mime')
      cleanRequireCache()
    })
  })

  describe('mime v2', () => {
    before(() => {
      cleanRequireCache()
      mime = require('./mime')
    })

    tests()

    after(() => {
      cleanRequireCache()
    })
  })
})
