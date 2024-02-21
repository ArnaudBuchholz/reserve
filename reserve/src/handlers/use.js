'use strict'

const { $useMiddleware, $handlerPrefix } = require('../symbols')
const smartImport = require('../helpers/smartImport')
const defer = require('../helpers/defer')

module.exports = {
  [$handlerPrefix]: 'use',
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
      factory = await smartImport(mapping.use)
    }
    const middleware = factory(mapping.options)
    if (middleware.length !== 3) {
      throw new Error('Unexpected middleware signature')
    }
    mapping[$useMiddleware] = middleware
  },
  redirect: ({ mapping, request, response }) => defer.$((resolve, reject) => {
    const useEnd = () => {
      resolve()
      response.end()
    }
    const monitoredResponse = new Proxy(response, {
      get (target, property) {
        if (property === 'end') {
          return useEnd
        }
        return response[property]
      }
    })
    const next = err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    }
    try {
      mapping[$useMiddleware](request, monitoredResponse, next)
    } catch (err) {
      reject(err)
    }
  })
}
