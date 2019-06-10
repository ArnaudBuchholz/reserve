'use strict'

module.exports = function (configuration, defaultHandlers) {
  if (configuration.handlers) {
    Object.assign(configuration.handlers, defaultHandlers)
  } else {
    configuration.handlers = defaultHandlers
  }
  configuration.handlerTypes = Object.keys(configuration.handlers)
}
