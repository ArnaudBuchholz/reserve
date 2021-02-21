'use strict'

const ns = 'REserve@'

module.exports = {
  $configuration: Symbol(`${ns}configuration`),
  $configurationInterface: Symbol(`${ns}configuration.interface`),
  $configurationRequests: Symbol(`${ns}configuration.requests`),
  $configurationEventEmitter: Symbol(`${ns}configuration.eventEmitter`),
  $customPath: Symbol(`${ns}custom.path`),
  $customCallback: Symbol(`${ns}custom.callback`),
  $customConfiguration: Symbol(`${ns}custom.configuration`),
  $customTimestamp: Symbol(`${ns}custom.timestamp`),
  $dispatcherEnd: Symbol(`${ns}dispatcher.end`),
  $handlerMethod: Symbol(`${ns}handler.method`),
  $handlerSchema: Symbol(`${ns}handler.schema`),
  $mappingChecked: Symbol(`${ns}mapping.checked`),
  $mappingMatch: Symbol(`${ns}mapping.match`),
  $mappingMethod: Symbol(`${ns}mapping.method`),
  $requestId: Symbol(`${ns}request.id`),
  $requestInternal: Symbol(`${ns}request.internal`),
  $responseEnded: Symbol(`${ns}response.ended`),
  $useMiddleware: Symbol(`${ns}use.middleware`)
}
