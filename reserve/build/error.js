'use strict'

const { writeFileSync } = require('fs')
const { join } = require('path')
const errors = require(join(__dirname, '../src/errors.json'))

writeFileSync(join(__dirname, '../src/error.js'), `'use strict'

const interpolate = require('./helpers/interpolate')

const errors = '${Object.values(errors).join('|')}'.split('|')

function newError (code, groups) {
  let message = errors[code]
  if (groups) {
    message = interpolate({ groups }, message)
  }
  const error = new Error(message)
  error.name = 'REserveError'
  error.code = code
  return error
}

function throwError (code, groups) {
  throw newError(code, groups)
}

module.exports = {
  throwError,
  newError,
  ${
    Object.keys(errors)
      .map((name, index) => `${name}: ${index}`)
      .join(',\n  ')
  }
}
`)
