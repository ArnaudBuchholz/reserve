'use strict'

module.exports = function () {
  let resolutionFunc, rejectionFunc
  const promise = new Promise((resolve, reject) => {
    resolutionFunc = resolve
    rejectionFunc = reject
  })
  return [promise, resolutionFunc, rejectionFunc]
}
