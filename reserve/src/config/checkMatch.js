'use strict'

const parseMatch = require('./parseMatch')
const { notTrueOrUndefined } = require('./schema')
const {
  throwError,
  ERROR_MAPPING_INVALID_INVERT_MATCH,
  ERROR_MAPPING_INVALID_IF_MATCH
} = require('../error')
const { $mappingMethod, $mappingMatch } = require('../symbols')

const methods = [
  function (request, url) {
    return this[$mappingMatch].exec(url)
  },
  function ({ method }, url) {
    return this[$mappingMethod].includes(method) && this[$mappingMatch].exec(url)
  },
  function (request, url) {
    return !this[$mappingMatch].exec(url)
  },
  function ({ method }, url) {
    return !this[$mappingMethod].includes(method) || !this[$mappingMatch].exec(url)
  }
]

module.exports = mapping => {
  let { match } = mapping
  if (match === undefined) {
    match = /(.*)/
  } else {
    match = parseMatch(match)
  }
  const invertMatch = mapping['invert-match']
  if (notTrueOrUndefined(invertMatch)) {
    throwError(ERROR_MAPPING_INVALID_INVERT_MATCH)
  }
  const ifMatch = mapping['if-match']
  if (!['undefined', 'function'].includes(typeof ifMatch)) {
    throwError(ERROR_MAPPING_INVALID_IF_MATCH)
  }
  let index = 0
  if (mapping[$mappingMethod]) {
    index += 1
  }
  if (invertMatch) {
    index += 2
  }
  const matchMethod = methods[index]
  if (ifMatch) {
    return function (request, url) {
      const match = matchMethod.call(this, request, url)
      if (match) {
        return ifMatch(request, url, match)
      }
      return false
    }
  }
  mapping[$mappingMatch] = matchMethod
}
