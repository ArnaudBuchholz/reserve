'use strict'

const {
  $configuration,
  $configurationRequests,
  $requestPromise
} = require('./symbols')

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

  async setMappings (mappings) {
    const configuration = this[$configuration]
    const configurationRequests = configuration[$configurationRequests]
    const requestPromise = configurationRequests.current[$requestPromise]
    const otherRequestsPromises = configurationRequests.promises.filter(promise => promise !== requestPromise)
    configurationRequests.hold = Promise.all(otherRequestsPromises)
      .then(() => {
        configuration.mappings = mappings
      })
    return configurationRequests.hold
  }
}
