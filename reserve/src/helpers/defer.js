'use strict'

const defer = () => {
  let resolutionFunc, rejectionFunc
  const promise = defer.$((resolve, reject) => {
    resolutionFunc = resolve
    rejectionFunc = reject
  })
  return [promise, resolutionFunc, rejectionFunc]
}

defer.$ = executor => new Promise((resolve, reject) => executor(resolve, reject))

module.exports = defer
