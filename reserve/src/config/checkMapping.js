'use strict'

const { validate, notTrueOrUndefined } = require('./schema')
const checkMethod = require('./checkMethod')
const checkMatch = require('./checkMatch')
const {
  $configurationInterface,
  $handlerMethod,
  $handlerSchema,
  $mappingChecked,
  $mappingMethod,
  $mappingHandler
} = require('../symbols')
const {
  throwError,
  ERROR_MAPPING_INVALID_EXCLUDE_FROM_HOLDING_LIST,
  ERROR_MAPPING_UNKNOWN_HANDLER
} = require('../error')

function checkCwd (configuration, mapping) {
  if (!mapping.cwd) {
    mapping.cwd = configuration.cwd
  }
}

function checkExcludeFromHoldingList (mapping) {
  if (notTrueOrUndefined(mapping['exclude-from-holding-list'])) {
    throwError(ERROR_MAPPING_INVALID_EXCLUDE_FROM_HOLDING_LIST)
  }
}

function checkHandler (configuration, mapping) {
  const { handlers } = configuration
  const types = Object.keys(handlers)
  for (const type of types) {
    const redirect = mapping[type]
    if (redirect !== undefined) {
      return {
        handler: handlers[type],
        redirect,
        type
      }
    }
  }
  throwError(ERROR_MAPPING_UNKNOWN_HANDLER, { mapping: JSON.stringify(mapping) })
}

module.exports = async (configuration, mapping) => {
  checkCwd(configuration, mapping)
  checkExcludeFromHoldingList(mapping)
  mapping[$mappingHandler] = checkHandler(configuration, mapping)
  const { handler } = mapping[$mappingHandler]
  checkMethod(mapping, $mappingMethod, handler[$handlerMethod])
  if (handler[$handlerSchema]) {
    validate(handler[$handlerSchema], mapping)
  }
  if (handler.validate) {
    await handler.validate(mapping, configuration[$configurationInterface])
  }
  checkMatch(mapping)
  mapping[$mappingChecked] = true
}
