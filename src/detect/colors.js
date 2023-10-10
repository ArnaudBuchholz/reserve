'use strict'

let colors

try {
  colors = require('colors/safe')
} catch (e) {}

const noColor = text => text

module.exports = colors || new Proxy({}, {
  get: () => noColor
})
