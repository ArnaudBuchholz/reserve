'use strict'

const { throwError, ERROR_METHOD_INVALID, ERROR_METHOD_NONE } = require('../error')

module.exports = (object, checkedMember, allowed) => {
  let method = object.method
  if (method === undefined) {
    object[checkedMember] = allowed
    return
  }
  if (typeof method === 'string') {
    method = method.split(',')
  }
  if (!Array.isArray(method)) {
    throwError(ERROR_METHOD_INVALID)
  }
  method = method.map(verb => verb.toUpperCase())
  if (allowed) {
    method = method.filter(verb => allowed.includes(verb))
  }
  if (!method.length) {
    throwError(ERROR_METHOD_NONE)
  }
  object[checkedMember] = method
}
