'use strict'

const { join } = require('../node-api')
const {
  $handlerPrefix,
  $customCallback,
  $customConfiguration
} = require('../symbols')
const smartImport = require('../smartImport')

module.exports = {
  [$handlerPrefix]: 'custom',
  schema: {
    custom: ['function', 'string']
  },
  validate: async mapping => {
    if (typeof mapping.custom === 'string') {
      mapping[$customCallback] = await smartImport(join(mapping.cwd, mapping.custom))
    } else {
      mapping[$customCallback] = mapping.custom
    }
    if (typeof mapping[$customCallback] !== 'function') {
      throw new Error('Invalid custom handler, expected a function')
    }
    if (mapping.configuration === undefined) {
      mapping[$customConfiguration] = true
    }
  },
  redirect: ({ configuration, mapping, match, request, response }) => {
    const parameters = [request, response].concat([].slice.call(match, 1))
    if (mapping[$customConfiguration]) {
      mapping.configuration = configuration
    }
    return mapping[$customCallback].apply(mapping, parameters)
  }
}
