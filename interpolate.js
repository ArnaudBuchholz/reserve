'use strict'

const types = {
  string: (match, value) => value.replace(/\$(\d+|\$)/g, (token, sIndex) => {
    if (sIndex === '$') {
      return '$'
    } else {
      return match[sIndex] || ''
    }
  }),

  object: (match, object) => {
    const interpolated = {}
    Object.keys(object).forEach(key => {
      interpolated[key] = interpolate(match, object[key])
    })
    return interpolated
  }
}

function interpolate (match, value) {
  const byType = types[typeof value]
  if (byType) {
    return byType(match, value)
  }
  return value
}

module.exports = interpolate
