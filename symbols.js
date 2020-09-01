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
  $handlerMethod: Symbol(`${ns}handler.method`),
  $handlerSchema: Symbol(`${ns}handler.schema`),
  $mappingChecked: Symbol(`${ns}mapping.checked`),
  $mappingMethod: Symbol(`${ns}mapping.method`),
  $requestId: Symbol(`${ns}request.id`),
  $requestPromise: Symbol(`${ns}request.promise`),
  $requestRedirectCount: Symbol(`${ns}request.redirectCount`),
  $responseEnded: Symbol(`${ns}response.ended`),
  $useMiddleware: Symbol(`${ns}use.middleware`)
}
