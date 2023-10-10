'use strict'

const { assert } = require('test-tools')
const mockRequire = require('mock-require')

function cleanRequireCache () {
  Object.keys(require.cache).forEach(path => {
    if (path.match(/(node_modules|detect)(\/|\\)colors/)) {
      delete require.cache[path]
    }
  })
}

describe('detect/colors', () => {
  let colors

  before(() => {
    cleanRequireCache()
    mockRequire('colors/safe', null)
    colors = require('./colors')
  })

  after(() => {
    mockRequire.stop('colors/safe')
    cleanRequireCache()
  })

  'red,green,cyan,magenta,white,gray'
    .split(',')
    .forEach(method => {
      it(`returns the initial string when using colors.${method}`, () => {
        assert(() => colors[method]('test') === 'test')
      })
    })
})
