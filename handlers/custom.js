'use strict'

module.exports = {
  schema: {
    self: 'function'
  },
  redirect: (request, response) => new Promise((resolve, reject) => {
    try {
      // Include timeout?
      request.mapping.custom(request, response)
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}
