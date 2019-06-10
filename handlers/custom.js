'use strict'

module.exports = {
  schema: {
    self: 'function'
  },
  redirect: (request, response) => new Promise((resolve, reject) => {
    // Include timeout?
    const parameters = [request, response].concat([].slice.call(request.match, 1))
    const result = request.mapping.custom.apply(request.mapping, parameters)
    if (result && typeof result.then === 'function') {
      result.then(resolve, reject)
    } else {
      resolve()
    }
  })
}
