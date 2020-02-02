'use strict'

const nativeAssert = require('assert')

function assert (condition) {
  const message = condition.toString().match(/(?:=>|{)([^}]*)\}?/)[1].toString()
  try {
    nativeAssert(condition(), message)
  } catch (e) {
    nativeAssert(false, message + '- EXCEPTION ' + e.toString())
  }
}

assert.notExpected = function () {
  nativeAssert(false, 'Not expected !')
}

module.exports = assert
