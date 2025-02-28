'use strict'

const { join } = require('../node-api')
const {
  $handlerPrefix,
  $customCallback,
  $customRedirect
} = require('../symbols')
const smartImport = require('../helpers/smartImport')
const { throwError, ERROR_CUSTOM_EXPECTED_FUNCTION } = require('../error')
const send = require('../helpers/send')

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
      throwError(ERROR_CUSTOM_EXPECTED_FUNCTION)
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
    const result = mapping[$customRedirect](request, response, match)
    if (result && result.then) {
      return result.then(asyncResult => {
        if (Array.isArray(asyncResult)) {
          return send(response, asyncResult[0], asyncResult[1])
        }
        return asyncResult
      })
    }
    if (Array.isArray(result)) {
      return send(response, result[0], result[1])
    }
    return result
  }
}
