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
} = require('./symbols')

function checkCwd (mapping) {
  if (!mapping.cwd) {
    mapping.cwd = process.cwd()
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

function checkInvertMatch (mapping) {
  const invertMatch = mapping['invert-match']
  if (invertMatch !== undefined && invertMatch !== true) {
    throw new Error('Invalid mapping invert-match')
  }
}

function checkHandler (configuration, mapping) {
  const { handler } = configuration.handler(mapping)
  if (!handler) {
    throw new Error('Unknown handler for mapping: ' + JSON.stringify(mapping))
  }
  return handler
}

module.exports = {
  async check (configuration, mapping) {
    checkCwd(mapping)
    checkMatch(mapping)
    checkInvertMatch(mapping)
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
}
