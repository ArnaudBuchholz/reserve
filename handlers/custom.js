'use strict'

module.exports = {
  schema: {
    custom: 'function'
  },
  redirect: ({mapping, match, request, response}) => new Promise((resolve, reject) => {
    // Include timeout?
    const parameters = [request, response].concat([].slice.call(match, 1))
    const result = mapping.custom.apply(mapping, parameters)
    if (result && typeof result.then === 'function') {
      result.then(resolve, reject)
    } else {
      resolve()
    }
  })
}
