'use strict'

const { $mappingMethod } = require('./symbols')

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
  /*
  const ifMatch = mapping['if-match']
  if (ifMatch) {

    try {
      const preprocess = await ifMatch(this.request)
      if (preprocess && preprocess !== true) {
        return redispatch.call(this, preprocess)
      } else if (!preprocess) {
        match = false
      }
    } catch (e) {
      return error.call(this, e)
    }
  } else {

  }
*/
  return matchMethod
}
