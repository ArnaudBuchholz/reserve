'use strict'

const toLowerCase = key => {
  if (typeof key === 'string') {
    return key.toLowerCase()
  }
  return key
}

module.exports = (initial = {}) => {
  const headers = new Proxy({}, {
    get (that, header) {
      return that[toLowerCase(header)]
    },

    set (that, header, value) {
      that[toLowerCase(header)] = value
      return true
    }
  })
  Reflect.ownKeys(initial).forEach(header => {
    headers[header] = initial[header]
  })
  return headers
}
