'use strict'

module.exports = {
  schema: {
    custom: 'function'
  },
  redirect: ({ mapping, match, request, response }) => new Promise(resolve => {
    // Include timeout?
    const parameters = [request, response].concat([].slice.call(match, 1))
    try {
      const result = mapping.custom.apply(mapping, parameters)
      if (result && typeof result.then === 'function') {
        result.then(resolve, () => resolve(500))
      } else {
        resolve()
      }
    } catch (e) {
      // TODO document issue
      resolve(500)
    }
  })
}
