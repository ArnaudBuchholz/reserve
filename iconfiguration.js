'use strict'

const { check } = require('./mapping')
const {
  $configuration,
  $configurationRequests,
  $mappingChecked
} = require('./symbols')

async function checkMappings (configuration, mappings) {
  for await (const mapping of mappings) {
    if (!mapping[$mappingChecked]) {
      await check(configuration, mapping)
    }
  }
}

module.exports = class IConfiguration {
  constructor (configuration) {
    this[$configuration] = configuration
  }

  get handlers () {
    return Object.assign({}, this[$configuration].handlers)
  }

  get mappings () {
    return [].concat(this[$configuration].mappings)
  }

  async setMappings (mappings, request) {
    const configuration = this[$configuration]
    await checkMappings(configuration, mappings)
    const configurationRequests = configuration[$configurationRequests]
    const { contexts } = configurationRequests
    const requestContext = contexts.filter(({ request: candidate }) => candidate === request)[0]
    const requestsHolding = contexts.filter(candidate => candidate !== requestContext).map(({ holding }) => holding)
    configurationRequests.holding = Promise.all(requestsHolding)
      .then(() => {
        configuration.mappings = mappings
      })
    return configurationRequests.holding
  }
}
