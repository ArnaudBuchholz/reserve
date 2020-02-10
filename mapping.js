'use strict'

const {
  $configurationInterface,
  $mappingChecked
} = require('./symbols')

function checkMappingCwd (mapping) {
  if (!mapping.cwd) {
    mapping.cwd = process.cwd()
  }
}

function checkMappingMatch (mapping) {
  if (typeof mapping.match === 'string') {
    mapping.match = new RegExp(mapping.match)
  }
}

function checkMappingHandler (configuration, mapping) {
  const { handler } = configuration.handler(mapping)
  if (!handler) {
    throw new Error('Unknown handler for mapping: ' + JSON.stringify(mapping))
  }
  return handler
}

module.exports = {
  async checkMapping (configuration, mapping) {
    checkMappingCwd(mapping)
    checkMappingMatch(mapping)
    const handler = checkMappingHandler(configuration, mapping)
    if (handler.validate) {
      await handler.validate(mapping, configuration[$configurationInterface])
    }
    mapping[$mappingChecked] = true
  }
}
