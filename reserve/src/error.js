'use strict'

const errors = [
  'Unknown event name',
  'Invalid callback',
]

function newError (code) {
  const message = errors[code]
  const erorr = new Error(message)
  error.name = 'REserveError'
  error.code = code
}

function throwError (code) {
  throw newError(code)
}

module.exports = {
  throwError,
  newError,
  ERROR_UNKNOWN_EVENT_NAME: 0,
  ERROR_INVALID_CALLBACK: 1
}
  