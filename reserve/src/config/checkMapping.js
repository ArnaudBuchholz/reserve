'use strict'

const { validate } = require('./schema')
const checkMethod = require('./checkMethod')
const buildMatch = require('./buildMatch')
const parseMatch = require('./parseMatch')
const {
  $configurationInterface,
  $handlerMethod,
  $handlerSchema,
  $mappingChecked,
  $mappingMatch,
  $mappingMethod
} = require('../symbols')
const {
  throwError,
  ERROR_MAPPING_INVALID_MATCH,
  ERROR_MAPPING_INVALID_INVERT_MATCH,
  ERROR_MAPPING_INVALID_IF_MATCH,
  ERROR_MAPPING_INVALID_EXCLUDE_FROM_HOLDING_LIST,
  ERROR_MAPPING_UNKNOWN_HANDLER
} = require('../error')

function checkCwd (configuration, mapping) {
  if (!mapping.cwd) {
    mapping.cwd = configuration.cwd
  }
}

function invalidMatch () {
  throwError(ERROR_MAPPING_INVALID_MATCH)
}

// TODO: do not alter mapping.match, use an intermediate symbol
const matchTypes = {
  undefined: mapping => {
    mapping.match = /(.*)/
  },
  string: (mapping, match) => {
    mapping.match = parseMatch(mapping.match)
  },
  object: (mapping, match) => {
    mapping.match = parseMatch(mapping.match)
  }
}

'boolean,number,bigint,symbol,function'
  .split(',')
  .forEach(type => {
    matchTypes[type] = invalidMatch
  })

function checkMatch (mapping) {
  matchTypes[typeof mapping.match](mapping, mapping.match)
}

function notTrueOnly (value) {
  return value !== undefined && value !== true
}

function checkInvertMatch (mapping) {
  if (notTrueOnly(mapping['invert-match'])) {
    throwError(ERROR_MAPPING_INVALID_INVERT_MATCH)
  }
}

function checkIfMatch (mapping) {
  const ifMatch = mapping['if-match']
  if (!['undefined', 'function'].includes(typeof ifMatch)) {
    throwError(ERROR_MAPPING_INVALID_IF_MATCH)
  }
}

function checkExcludeFromHoldingList (mapping) {
  if (notTrueOnly(mapping['exclude-from-holding-list'])) {
    throwError(ERROR_MAPPING_INVALID_EXCLUDE_FROM_HOLDING_LIST)
  }
}

function checkHandler (configuration, mapping) {
  const { handler } = configuration.handler(mapping)
  if (!handler) {
    throwError(ERROR_MAPPING_UNKNOWN_HANDLER, { mapping: JSON.stringify(mapping) })
  }
  return handler
}

module.exports = async (configuration, mapping) => {
  checkCwd(configuration, mapping)
  checkMatch(mapping)
  checkInvertMatch(mapping)
  checkIfMatch(mapping)
  checkExcludeFromHoldingList(mapping)
  const handler = checkHandler(configuration, mapping)
  checkMethod(mapping, $mappingMethod, handler[$handlerMethod])
  if (handler[$handlerSchema]) {
    validate(handler[$handlerSchema], mapping)
  }
  if (handler.validate) {
    await handler.validate(mapping, configuration[$configurationInterface])
  }
  mapping[$mappingMatch] = buildMatch(mapping)
  mapping[$mappingChecked] = true
}
