'use strict'

const { gray, red, green } = require('./detect/colors')
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

  async setMappings (mappings, request, timeout = 5000) {
    const configuration = this[$configuration]
    await checkMappings(configuration, mappings)
    const configurationRequests = configuration[$configurationRequests]
    const { contexts } = configurationRequests
    const requestContext = contexts.filter(({ request: candidate }) => candidate === request)[0]
    const requestsHolding = contexts.filter(candidate => candidate !== requestContext).map(({ holding }) => holding)
    const holding = Promise.race([
      Promise.all(requestsHolding),
      new Promise((resolve, reject) => setTimeout(() => {
        reject(new Error('iconfiguration.setMappings appears to be blocked'))
      }, timeout))
    ])
      .then(() => {
        configuration.mappings = mappings
      })
    configurationRequests.holding = holding.then(undefined, () => {}) // Absorb error to unblock server
    holding.then(undefined, () => {
      console.log(red('REserve detected a long holding request during configuration.setMappings'))
      contexts.forEach(({ request, released }) => {
        let status
        if (released) {
          status = green('excluded from holding list')
        } else {
          status = ''
        }
        console.log(gray(request.method), gray(request.url), status)
      })
    })
    return holding
  }
}
