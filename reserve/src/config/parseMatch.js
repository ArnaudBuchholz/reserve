'use strict'

module.exports = match => {
  if (match instanceof RegExp) {
    return match
  }
  if (match && match.re) {
    return new RegExp(match.re, match.flags)
  }
  
}
