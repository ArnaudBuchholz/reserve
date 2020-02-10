'use strict'

const ns = 'REserve@'

module.exports = {
  $configuration: Symbol(`${ns}configuration`),
  $configurationInterface: Symbol(`${ns}configuration.interface`),
  $configurationRequests: Symbol(`${ns}configuration.requests`),
  $mappingChecked: Symbol(`${ns}mapping.checked`),
  $requestPromise: Symbol(`${ns}request.promise`),
  $requestRedirectCount: Symbol(`${ns}request.redirectCount`),
  $responseEnded: Symbol(`${ns}response.ended`)
}
