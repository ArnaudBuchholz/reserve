'use strict'

function reviver (key, value) {
  if (key === '__proto__' || key === 'constructor') {
    return undefined
  }
  return value
}

module.exports = (text) => JSON.parse(text, reviver)
