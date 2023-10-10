'use strict'

const { $useMiddleware } = require('../symbols')

module.exports = {
  schema: {
    use: ['string', 'function'],
    options: {
      type: 'object',
      defaultValue: {}
    }
  },
  validate: async mapping => {
    let factory
    if (typeof mapping.use === 'function') {
      factory = mapping.use
    } else {
      factory = require(mapping.use)
    }
    const middleware = factory(mapping.options)
    if (middleware.length !== 3) {
      throw new Error('Unexpected middleware signature')
    }
    mapping[$useMiddleware] = middleware
  },
  redirect: ({ mapping, request, response }) => new Promise((resolve, reject) => {
    const next = err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    }
    try {
      mapping[$useMiddleware](request, response, next)
    } catch (err) {
      reject(err)
    }
  })
}
