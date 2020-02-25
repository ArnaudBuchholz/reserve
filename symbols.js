'use strict'

const ns = 'REserve@'

module.exports = {
  $configuration: Symbol(`${ns}configuration`),
  $configurationInterface: Symbol(`${ns}configuration.interface`),
  $configurationRequests: Symbol(`${ns}configuration.requests`),
  $customPath: Symbol(`${ns}custom.path`),
  $customCallback: Symbol(`${ns}custom.callback`),
  $customTimestamp: Symbol(`${ns}custom.timestamp`),
  $dispatcherEnd: Symbol(`${ns}dispatcher.end`),
  $handlerSchema: Symbol(`${ns}handler.schema`),
  $mappingChecked: Symbol(`${ns}mapping.checked`),
  $requestPromise: Symbol(`${ns}request.promise`),
  $requestRedirectCount: Symbol(`${ns}request.redirectCount`),
  $responseEnded: Symbol(`${ns}response.ended`),
  $useMiddleware: Symbol(`${ns}use.middleware`)
}
