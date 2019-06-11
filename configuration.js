'use strict'

const defaults = {
  hostname: '127.0.0.1',
  port: 5000,
  mappings: [{
    'match': '(.*)',
    'file': './$1'
  }]
}

function applyDefaults (configuration) {
  Object.keys(defaults).forEach(property => {
    if (!configuration.hasOwnProperty(property)) {
      configuration[property] = defaults[property]
    }
  })
}

function setHandlers (configuration, defaultHandlers) {
  if (configuration.handlers) {
    // Default hanlders can't be overridden
    Object.assign(configuration.handlers, defaultHandlers)
  } else {
    configuration.handlers = defaultHandlers
  }
  const types = Object.keys(configuration.handlers)
  configuration.handler = mapping => {
    let redirect
    let type
    let handler
    if (types.every(member => {
      type = member
      redirect = mapping[member]
      if (redirect !== undefined) {
        handler = configuration.handlers[member]
        return false
      }
      return true
    })) {
      return {}
    }
    return {
      handler,
      redirect,
      type
    }
  }
}

async function checkProtocol (configuration) {
  if (configuration.ssl) {
    configuration.protocol = 'https'
    // TODO check/load certificates
  } else {
    configuration.protocol = 'http'
  }
}

function checkMappings (configuration) {
  configuration.mappings.forEach(mapping => {
    if (typeof mapping.match === 'string') {
      mapping.match = new RegExp(mapping.match)
      const { handler } = configuration.handler(mapping)
      if (!handler) {
        throw new Error('Unknown handler for mapping: ' + JSON.stringify(mapping))
      }
      // TODO validate mapping properties
    }
  })
}

module.exports = async function (configuration, defaultHandlers) {
  applyDefaults(configuration)
  setHandlers(configuration, defaultHandlers)
  await checkProtocol(configuration)
  checkMappings(configuration)
}
