'use strict'

const { join } = require('../node-api')
const {
  $handlerPrefix,
  $customCallback,
  $customRedirect
} = require('../symbols')
const smartImport = require('../smartImport')

function withMatch (callback, request, response, [, ...additional]) {
  return callback.call(this, request, response, ...additional)
}

module.exports = {
  [$handlerPrefix]: 'custom',
  schema: {
    custom: ['function', 'string']
  },
  validate: async (mapping, configuration) => {
    if (typeof mapping.custom === 'string') {
      mapping[$customCallback] = await smartImport(join(mapping.cwd, mapping.custom))
    } else {
      mapping[$customCallback] = mapping.custom
    }
    if (typeof mapping[$customCallback] !== 'function') {
      throw new Error('Invalid custom handler, expected a function')
    }
    const { length } = mapping[$customCallback]
    if (length === 0 || length > 2) {
      mapping[$customRedirect] = withMatch.bind(mapping, mapping[$customCallback])
    } else {
      mapping[$customRedirect] = mapping[$customCallback]
    }
    mapping.configuration = configuration
  },
  redirect: ({ mapping, match, request, response }) => {
    return mapping[$customRedirect](request, response, match)
  }
}
