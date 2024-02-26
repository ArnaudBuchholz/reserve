'use strict'

const ns = 'REserve@'

module.exports = {
  $configuration: Symbol(`${ns}configuration`),
  $configurationInterface: Symbol(`${ns}configuration.interface`),
  $configurationRequests: Symbol(`${ns}configuration.requests`),
  $configurationEventEmitter: Symbol(`${ns}configuration.eventEmitter`),
  $customCallback: Symbol(`${ns}custom.callback`),
  $customRedirect: Symbol(`${ns}custom.redirect`),
  $handlerPrefix: Symbol(`${ns}handler.prefix`),
  $handlerMethod: Symbol(`${ns}handler.method`),
  $handlerSchema: Symbol(`${ns}handler.schema`),
  $mappingChecked: Symbol(`${ns}mapping.checked`),
  $mappingMatch: Symbol(`${ns}mapping.match`),
  $mappingMatchFunc: Symbol(`${ns}mapping.matchFunction`),
  $mappingMethod: Symbol(`${ns}mapping.method`),
  $requestId: Symbol(`${ns}request.id`),
  $requestInternal: Symbol(`${ns}request.internal`),
  $useMiddleware: Symbol(`${ns}use.middleware`),
  $fileCache: Symbol(`${ns}file.cache`)
}
