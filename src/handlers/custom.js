'use strict'

const { join, stat } = require('../node-api')

const {
  $handlerPrefix,
  $customCallback,
  $customConfiguration
} = require('../symbols')

module.exports = {
  [$handlerPrefix]: 'custom',
  schema: {
    custom: ['function', 'string']
  },
  validate: async mapping => {
    if (typeof mapping.custom === 'string') {
      mapping[$customCallback] = require(join(mapping.cwd, mapping.custom))
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
  redirect: async ({ configuration, mapping, match, request, response }) => {
    const parameters = [request, response].concat([].slice.call(match, 1))
    if (mapping[$customConfiguration]) {
      mapping.configuration = configuration
    }
    return mapping[$customCallback].apply(mapping, parameters)
  }
}
