'use strict'

const { checkMapping } = require('./mapping')

const {
  $configuration,
  $configurationRequests,
  $mappingChecked,
  $requestPromise
} = require('./symbols')

async function checkMappings (configuration, mappings) {
  for await (const mapping of mappings) {
    if (!mapping[$mappingChecked]) {
      await checkMapping(configuration, mapping)
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
    const requestPromise = request[$requestPromise]
    const otherRequestsPromises = configurationRequests.promises.filter(promise => promise !== requestPromise)
    configurationRequests.hold = Promise.all(otherRequestsPromises)
      .then(() => {
        configuration.mappings = mappings
      })
    return configurationRequests.hold
  }
}
