'use strict'

const { colors } = require('../dependencies')

const noColor = text => text

module.exports = colors || new Proxy({}, {
  get: () => noColor
})
