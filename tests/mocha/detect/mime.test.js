'use strict'

const assert = require('../assert')
const mockRequire = require('mock-require')

function cleanRequireCache () {
  Object.keys(require.cache).forEach(path => {
    if (path.match(/(node_modules|detect)(\/|\\)mime/)) {
      delete require.cache[path]
    }
  })
}

describe('detect/mime', () => {
  let mime

  before(() => {
    cleanRequireCache()
    mockRequire('mime', null)
    mime = require('../../../detect/mime')
  })

  after(() => {
    mockRequire.stop('mime')
    cleanRequireCache()
  })

  const expected = {
    text: 'text/plain',
    html: 'text/html',
    unknown: 'application/octet-stream'
  }

  Object.keys(expected).forEach(extension => {
    const mimeType = expected[extension]
    it(`returns the expcted mime type for extension .${extension}`, () => {
      assert(() => mime.getType(extension) === mimeType)
      assert(() => mime.getType(`.${extension}`) === mimeType)
    })
  })
})
