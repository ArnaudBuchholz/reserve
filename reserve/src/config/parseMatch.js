'use strict'

const { throwError, ERROR_MAPPING_INVALID_MATCH } = require('../error')

const regexpClues = '()^$[]|\\?+*{}'.split('')

module.exports = match => {
  if (match instanceof RegExp) {
    return match
  }
  if (match && match.re) {
    return new RegExp(match.re, match.flags)
  }
  if (typeof match !== 'string') {
    throwError(ERROR_MAPPING_INVALID_MATCH)
  }
  if (regexpClues.some(clue => match.includes(clue))) {
    return new RegExp(match)
  }
  return new RegExp(`^${
    match.replace(/:(\w+)/g, (_, id) => `(?<${id}>[^/]*)`)
  }\\b(.*)`)
}
