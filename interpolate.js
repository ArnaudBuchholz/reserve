'use strict'

module.exports = function (match, value) {
  if (typeof value === 'string') {
    return value.replace(/\$(\d+|\$)/g, (token, sIndex) => {
      if (sIndex === '$') {
        return '$'
      } else {
        return match[sIndex] || ''
      }
    })
  }
  return value
}
