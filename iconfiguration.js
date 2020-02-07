'use strict'

const $configuration = Symbol('configuration')

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
    configuration.holdRequests = Promise.all(configuration.pendingRequests)
      .then(() => {
        configuration.mappings = mappings
      })
    return configuration.holdRequests
  }
}
