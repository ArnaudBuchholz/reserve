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

function checkMatch (mapping) {
  if (typeof mapping.match === 'string') {
    mapping.match = new RegExp(mapping.match)
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
