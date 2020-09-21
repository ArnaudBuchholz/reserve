'use strict'

const { $mappingMethod } = require('./symbols')

const methods = [
  function (method, url) {
    return this.match.exec(url)
  },
  function (method, url) {
    return this[$mappingMethod].includes(method) && this.match.exec(url)
  },
  function (method, url) {
    return !this.match.exec(url)
  },
  function (method, url) {
    return !this[$mappingMethod].includes(method) || !this.match.exec(url)
  }
]

module.exports = function (mapping) {
  let index = 0
  if (mapping[$mappingMethod]) {
    index += 1
  }
  if (mapping['invert-match']) {
    index += 2
  }
  return methods[index]
}
