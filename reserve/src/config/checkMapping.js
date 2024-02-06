'use strict'

const { validate } = require('./schema')
const checkMethod = require('./checkMethod')
const buildMatch = require('./buildMatch')
const {
  $configurationInterface,
  $handlerMethod,
  $handlerSchema,
  $mappingChecked,
  $mappingMatch,
  $mappingMethod
} = require('../symbols')

function checkCwd (configuration, mapping) {
  if (!mapping.cwd) {
    mapping.cwd = configuration.cwd
  }
}

function invalidMatch () {
  throw new Error('Invalid mapping match')
}

const matchTypes = {
  undefined: mapping => {
    mapping.match = /(.*)/
  },
  string: (mapping, match) => {
    mapping.match = new RegExp(mapping.match)
  },
  object: (mapping, match) => {
    if (!(mapping.match instanceof RegExp)) {
      invalidMatch()
    }
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
    throw new Error('Invalid mapping invert-match')
  }
}

function checkIfMatch (mapping) {
  const ifMatch = mapping['if-match']
  if (!['undefined', 'function'].includes(typeof ifMatch)) {
    throw new Error('Invalid mapping if-match')
  }
}

function checkExcludeFromHoldingList (mapping) {
  if (notTrueOnly(mapping['exclude-from-holding-list'])) {
    throw new Error('Invalid mapping exclude-from-holding-list')
  }
}

function checkHandler (configuration, mapping) {
  const { handler } = configuration.handler(mapping)
  if (!handler) {
    throw new Error('Unknown handler for mapping: ' + JSON.stringify(mapping))
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
