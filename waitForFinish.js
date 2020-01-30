'use strict'

module.exports = function () {
  let resolver
  const promise = new Promise(resolve => {
    resolver = resolve
  })
  this.on('finish', resolver)
  return promise
}
