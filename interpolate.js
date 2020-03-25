'use strict'

const unescape = {
  '&': decodeURI,
  '%': decodeURIComponent
}

const types = {
  string: (match, value) => value.replace(/\$(%|&)?(\d+)|\$\$/g, (token, sUnescapeType, sIndex) => {
    if (!sIndex) {
      return '$'
    }
    const string = match[sIndex] || ''
    if (sUnescapeType) {
      return unescape[sUnescapeType](string)
    }
    return string
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
