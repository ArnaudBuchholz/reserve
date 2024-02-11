'use strict'

const interpolatorsByType = {
  string: (match, value) => value.replace(/\$(\d+)|\$(\w+)|\$\$/g, (token, index, name) => {
    if (index) {
      return match[index] || ''
    }
    if (name) {
      return (match.groups && match.groups[name]) || ''
    }
    return '$'
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
  const byType = interpolatorsByType[typeof value]
  if (byType) {
    return byType(match, value)
  }
  return value
}

module.exports = interpolate
