'use strict'

const assert = require('assert')

module.exports = condition => {
  const message = condition.toString().match(/(?:=>|{)([^}]*)\}?/)[1].toString()
  try {
    assert(condition(), message)
  } catch (e) {
    assert(false, message + '- EXCEPTION ' + e.toString())
  }
}
