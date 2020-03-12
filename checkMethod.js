'use strict'

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
    throw new Error('Invalid method specification')
  }
  method = method.map(verb => verb.toUpperCase())
  if (allowed) {
    method = method.filter(verb => allowed.includes(verb))
  }
  if (!method.length) {
    throw new Error('No method specified (or left)')
  }
  object[checkedMember] = method
}
