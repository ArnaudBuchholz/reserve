'use strict'

const { log, error } = require('../console')

module.exports = function (type, showId, ...text) {
  let method
  const params = []
  if (type === 'ERROR') {
    method = error
    params.push(type)
  } else {
    method = log
    params.push(type)
  }
  if (showId) {
    const id = this.id.toString(16).toUpperCase()
    params.push(id.padStart(Math.max(4, id.length), '0'))
    if (this.internal) {
      params.push('(i)')
    }
  } else {
    params.push(this.method, this.url)
  }
  params.push(text.join(' '))
  method(...params)
}
