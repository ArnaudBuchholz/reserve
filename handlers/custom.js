'use strict'

module.exports = {
  schema: {
    self: 'function'
  },
  redirect: (request, response) => {
    try {
      // Include timeout?
      request.mapping(request, response)
    } catch (e) {
      //
    }
  }
}
