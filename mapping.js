'use strict'

const { validate } = require('./schema')
const {
  $configurationInterface,
  $handlerSchema,
  $mappingChecked
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
      throw new Error('')
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
    const handler = checkHandler(configuration, mapping)
    if (handler[$handlerSchema]) {
      validate(handler[$handlerSchema], mapping)
    }
    if (handler.validate) {
      await handler.validate(mapping, configuration[$configurationInterface])
    }
    mapping[$mappingChecked] = true
  }
}
