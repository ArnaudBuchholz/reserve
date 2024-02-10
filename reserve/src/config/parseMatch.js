'use strict'

const regexpClues = '()^$[]|\\?+*{}'.split('')

module.exports = match => {
  if (match instanceof RegExp) {
    return match
  }
  if (match && match.re) {
    return new RegExp(match.re, match.flags)
  }
  if (typeof match !== 'string') {
    throw new Error('Invalid value for match')
  }
  if (regexpClues.some(clue => match.includes(clue))) {
    if (match.startsWith('/')) {
      match = '^' + match
    }
    return new RegExp(match)
  }
  return new RegExp(`^${
    match.replace(/:(\w+)/g, (_, id) => `(?<${id}>[^/]*)`)
  }(.*)`)
}
