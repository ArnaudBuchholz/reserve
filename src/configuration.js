'use strict'

const { readFile, stat, dirname, isAbsolute, join } = require('./node-api')
const IConfiguration = require('./iconfiguration')
const { check } = require('./mapping')
const checkMethod = require('./checkMethod')
const { parse } = require('./schema')
const {
  $configurationInterface,
  $configurationRequests,
  $handlerPrefix,
  $handlerMethod,
  $handlerSchema
} = require('./symbols')

const defaultHandlers = [
  require('./handlers/custom'),
  require('./handlers/file'),
  require('./handlers/status'),
  require('./handlers/url'),
  require('./handlers/use')
].reduce((handlers, handler) => {
  handlers[handler[$handlerPrefix]] = handler
  return handlers
}, {})

const defaults = {
  hostname: undefined,
  port: 5000,
  'max-redirect': 10,
  listeners: [],
  mappings: [{
    match: '(.*)',
    file: './$1'
  }, {
    status: 404
  }]
}

function applyDefaults (configuration) {
  Object.keys(defaults).forEach(property => {
    if (!Object.prototype.hasOwnProperty.call(configuration, property)) {
      configuration[property] = defaults[property]
    }
  })
}

function getHandler (handlers, types, mapping) {
  for (let index = 0; index < types.length; ++index) {
    const type = types[index]
    const redirect = mapping[type]
    if (redirect !== undefined) {
      return {
        handler: handlers[type],
        redirect,
        type
      }
    }
  }
  return {}
}

function checkHandler (handler, type) {
  if (handler.schema) {
    handler[$handlerSchema] = parse(handler.schema)
    delete handler.schema
  }
  if (handler.method) {
    checkMethod(handler, $handlerMethod)
    delete handler.method
  }
  if (typeof handler.redirect !== 'function') {
    throw new Error('Invalid "' + type + '" handler: redirect is not a function')
  }
}

function validateHandler (type) {
  const handlers = this.handlers
  let handler = handlers[type]
  if (typeof handler === 'string') {
    handler = require(handler)
    handlers[type] = handler
  }
  checkHandler(handler, type)
  Object.freeze(handler)
}

function setHandlers (configuration) {
  if (configuration.handlers) {
    // Default hanlders can't be overridden
    configuration.handlers = Object.assign({}, configuration.handlers, defaultHandlers)
  } else {
    configuration.handlers = Object.assign({}, defaultHandlers)
  }
  Object.keys(configuration.handlers).forEach(validateHandler.bind(configuration))
  configuration.handler = getHandler.bind(null, configuration.handlers, Object.keys(configuration.handlers))
}

function invalidListeners () {
  throw new Error('Invalid listeners member, must be an array of functions')
}

function checkListeners (configuration) {
  const listeners = configuration.listeners
  if (!Array.isArray(listeners)) {
    invalidListeners()
  }
  configuration.listeners = listeners.map(register => {
    let registerType = typeof register
    if (registerType === 'string') {
      register = require(join(configuration.cwd || process.cwd(), register))
      registerType = typeof register
    }
    if (registerType !== 'function') {
      invalidListeners()
    }
    return register
  })
}

async function readSslFile (configuration, filePath) {
  if (isAbsolute(filePath)) {
    return (await readFile(filePath)).toString()
  }
  return (await readFile(join(configuration.ssl.cwd, filePath))).toString()
}

async function checkProtocol (configuration) {
  if (configuration.ssl) {
    configuration.ssl.cert = await readSslFile(configuration, configuration.ssl.cert)
    configuration.ssl.key = await readSslFile(configuration, configuration.ssl.key)
    configuration.protocol = 'https'
  } else {
    configuration.protocol = 'http'
  }
  if (![true, false, undefined].includes(configuration.http2)) {
    throw new Error('Invalid http2 setting')
  }
  if (!configuration.http2) {
    configuration.http2 = false
  }
}

async function checkMappings (configuration) {
  const configurationInterface = new IConfiguration(configuration)
  configuration[$configurationInterface] = configurationInterface
  for await (const mapping of configuration.mappings) {
    await check(configuration, mapping)
  }
}

function setCwd (folderPath, configuration) {
  if (configuration.handlers) {
    Object.keys(configuration.handlers).forEach(prefix => {
      const handler = configuration.handlers[prefix]
      if (typeof handler === 'string' && handler.match(/^\.\.?\//)) {
        configuration.handlers[prefix] = join(folderPath, handler)
      }
    })
  }
  if (configuration.mappings) {
    configuration.mappings.forEach(mapping => {
      if (!mapping.cwd) {
        mapping.cwd = folderPath
      }
    })
  }
  if (configuration.ssl && !configuration.ssl.cwd) {
    configuration.ssl.cwd = folderPath
  }
  configuration.cwd = folderPath
}

function extend (filePath, configuration) {
  const folderPath = dirname(filePath)
  setCwd(folderPath, configuration)
  if (configuration.extend) {
    const basefilePath = join(folderPath, configuration.extend)
    delete configuration.extend
    return readFile(basefilePath)
      .then(buffer => JSON.parse(buffer.toString()))
      .then(baseConfiguration => {
        // Only merge mappings
        const baseMappings = baseConfiguration.mappings
        const mergedConfiguration = Object.assign(baseConfiguration, configuration)
        if (baseMappings && baseMappings !== mergedConfiguration.mappings) {
          mergedConfiguration.mappings = [...configuration.mappings, ...baseMappings]
        }
        return extend(basefilePath, mergedConfiguration)
      })
  }
  return configuration
}

module.exports = {
  checkHandler,

  async check (configuration) {
    if (typeof configuration !== 'object' || configuration === null) {
      throw new Error('Configuration must be an object')
    }
    const checkedConfiguration = Object.assign({}, configuration)
    applyDefaults(checkedConfiguration)
    setHandlers(checkedConfiguration)
    checkListeners(checkedConfiguration)
    await checkProtocol(checkedConfiguration)
    await checkMappings(checkedConfiguration)
    checkedConfiguration[$configurationRequests] = {
      lastId: 0,
      holding: Promise.resolve(),
      contexts: []
    }
    return checkedConfiguration
  },

  async read (fileName) {
    let filePath
    if (isAbsolute(fileName)) {
      filePath = fileName
    } else {
      filePath = join(process.cwd(), fileName)
    }
    return stat(filePath)
      .then(() => readFile(filePath).then(buffer => JSON.parse(buffer.toString())))
      .then(configuration => extend(filePath, configuration))
  }
}
