'use strict'

const ns = 'REserve@'

module.exports = {
  $configuration: Symbol(`${ns}configuration`),
  $configurationClosed: Symbol(`${ns}configuration.closed`),
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
  $mappingMethod: Symbol(`${ns}mapping.method`),
  $mappingHandler: Symbol(`${ns}mapping.handler`),
  $requestInternal: Symbol(`${ns}request.internal`),
  $requestContext: Symbol(`${ns}request.context`),
  $useMiddleware: Symbol(`${ns}use.middleware`),
  $fileCache: Symbol(`${ns}file.cache`)
}
