'use strict'

const parseMatch = require('./parseMatch')
const { notTrueOrUndefined } = require('./schema')
const {
  throwError,
  ERROR_MAPPING_INVALID_INVERT_MATCH,
  ERROR_MAPPING_INVALID_IF_MATCH
} = require('../error')
const { $mappingMethod, $mappingMatch } = require('../symbols')

const factories = [
  match => url => match.exec(url),
  (match, methods) => (url, { method }) => methods.includes(method) && match.exec(url),
  match => url => match.exec(url) ? false : [],
  (match, methods) => (url, { method }) => methods.includes(method) && match.exec(url) ? false : []
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
  const methods = mapping[$mappingMethod]
  if (methods) {
    index += 1
  }
  if (invertMatch) {
    index += 2
  }
  const baseMatch = factories[index](match, methods)
  if (ifMatch) {
    mapping[$mappingMatch] = function (url, request) {
      const initialMatch = baseMatch(url, request)
      const process = result => {
        if (result === true) {
          return initialMatch
        }
        if (result) {
          return result
        }
        return null
      }
      if (initialMatch) {
        match = ifMatch(request, initialMatch)
        if (match && match.then) {
          return match.then(process)
        }
        return process(match)
      }
      return null
    }
  } else {
    mapping[$mappingMatch] = baseMatch
  }
}
