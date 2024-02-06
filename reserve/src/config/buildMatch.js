'use strict'

const { $mappingMethod } = require('../symbols')

const methods = [
  function (request, url) {
    return this.match.exec(url)
  },
  function ({ method }, url) {
    return this[$mappingMethod].includes(method) && this.match.exec(url)
  },
  function (request, url) {
    return !this.match.exec(url)
  },
  function ({ method }, url) {
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
  const matchMethod = methods[index]
  const ifMatch = mapping['if-match']
  if (ifMatch) {
    return function (request, url) {
      const match = matchMethod.call(this, request, url)
      if (match) {
        return ifMatch(request, url, match)
      }
      return false
    }
  }
  return matchMethod
}
