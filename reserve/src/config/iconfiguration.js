'use strict'

const checkMapping = require('./checkMapping')
const dispatcher = require('../dispatcher')
const {
  $configuration,
  $configurationRequests,
  $mappingChecked,
  $requestId,
  $requestInternal
} = require('../symbols')
const defer = require('../helpers/defer')
const { newError, ERROR_ICONFIG_SET_MAPPINGS_BLOCKED } = require('../error')

async function checkMappings (configuration, mappings) {
  for (const mapping of mappings) {
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
    const { handlers } = this[$configuration]
    return Object.keys(handlers).reduce((readonly, type) => {
      readonly[type] = Object.assign({}, handlers[type])
      return readonly
    }, {})
  }

  get mappings () {
    return [].concat(this[$configuration].mappings)
  }

  get http2 () {
    return this[$configuration].http2
  }

  get protocol () {
    return this[$configuration].protocol
  }

  async setMappings (mappings, request, timeout = 5000) {
    const configuration = this[$configuration]
    await checkMappings(configuration, mappings)
    const configurationRequests = configuration[$configurationRequests]
    const contexts = Object.values(configurationRequests.contexts)
    const requestContext = contexts.filter(({ request: candidate }) => candidate === request)[0]
    const requestsHolding = contexts.filter(candidate => candidate !== requestContext).map(({ holding }) => holding)
    const [timedOutPromise, , onTimeout] = defer()
    const timeoutId = setTimeout(() => onTimeout(newError(ERROR_ICONFIG_SET_MAPPINGS_BLOCKED)), timeout)
    const holding = Promise.race([
      Promise.all(requestsHolding),
      timedOutPromise
    ])
      .then(() => {
        clearTimeout(timeoutId)
        configuration.mappings = mappings
      })
    configurationRequests.holding = holding.then(undefined, () => {}) // Absorb error to unblock server
    holding.then(undefined, () => {
      console.log('REserve blocked during configuration.setMappings')
      console.table(contexts.map(context => {
        const { emitParameters, request, nonHolding } = context
        let info
        if (emitParameters.statusCode) {
          info = { statusCode: emitParameters.statusCode }
        } else if (nonHolding) {
          info = 'exclude-from-holding-list'
        } else if (context === requestContext) {
          info = 'configure.setMappings'
        } else {
          info = { ms: (new Date() - emitParameters.start) } // + ' ms'
        }
        return {
          id: request[$requestId],
          method: request.method,
          url: request.url,
          info
        }
      }))
    })
    return holding
  }

  dispatch (request, response) {
    const configuration = this[$configuration]
    request[$requestInternal] = true
    return dispatcher(configuration, request, response)
  }
}
