'use strict'

module.exports = (initial = {}) => {
  const headers = new Proxy({}, {
    get (that, header) {
      return that[header.toLowerCase()]
    },

    set (that, header, value) {
      that[header.toLowerCase()] = value
      return true
    }
  })
  Object.keys(initial).forEach(header => {
    headers[header] = initial[header]
  })
  return headers
}
