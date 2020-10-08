'use strict'

const { gray, magenta, red, yellow } = require('./detect/colors')
const { log, error } = require('./console')

module.exports = function (type, showId, ...text) {
  let method
  const params = []
  if (type === 'ERROR') {
    method = error
    params.push(red(type))
  } else {
    method = log
    params.push(magenta(type))
  }
  if (showId) {
    const id = this.id.toString(16).toUpperCase()
    params.push(yellow(id.padStart(Math.max(4, id.length), '0')))
  } else {
    params.push(gray(this.method), gray(this.url))
  }
  params.push(text.join(' '))
  method(...params)
}
