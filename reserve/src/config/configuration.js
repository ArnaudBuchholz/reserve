'use strict'

const { readFile, stat, dirname, isAbsolute, join } = require('../node-api')
const IConfiguration = require('./iconfiguration')
const checkMapping = require('./checkMapping')
const checkMethod = require('./checkMethod')
const { parse } = require('./schema')
const {
  $configurationInterface,
  $configurationRequests,
  $handlerPrefix,
  $handlerMethod,
  $handlerSchema
} = require('../symbols')
const smartImport = require('../helpers/smartImport')
const {
  throwError,
  ERROR_CONFIG_INVALID_HANDLER,
  ERROR_CONFIG_INVALID_LISTENERS,
  ERROR_CONFIG_INVALID_HTTP2_SETTING,
  ERROR_CONFIG_NOT_AN_OBJECT
} = require('../error')

const defaultHandlers = [
  require('../handlers/custom'),
  require('../handlers/file'),
  require('../handlers/status'),
  require('../handlers/url'),
  require('../handlers/use')
].reduce((handlers, handler) => {
  handlers[handler[$handlerPrefix]] = handler
  return handlers
}, {})

const defaults = {
  cwd: process.cwd(),
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
    throwError(ERROR_CONFIG_INVALID_HANDLER, { type })
  }
}

async function validateHandler ({ cwd, handlers }, type) {
  let handler = handlers[type]
  if (typeof handler === 'string') {
    if (!isAbsolute(handler)) {
      handler = join(cwd, handler)
    }
    handler = await smartImport(handler)
    handlers[type] = handler
  }
  checkHandler(handler, type)
  Object.freeze(handler)
}

async function setHandlers (configuration) {
  if (configuration.handlers) {
    // Default handlers can't be overridden
    configuration.handlers = Object.assign({}, configuration.handlers, defaultHandlers)
  } else {
    configuration.handlers = Object.assign({}, defaultHandlers)
  }
  for (const type of Object.keys(configuration.handlers)) {
    await validateHandler(configuration, type)
  }
}

function invalidListeners () {
  throwError(ERROR_CONFIG_INVALID_LISTENERS)
}

async function checkListeners ({ cwd, listeners }) {
  if (!Array.isArray(listeners)) {
    invalidListeners()
  }
  let index = 0
  for (let register of listeners) {
    let registerType = typeof register
    if (registerType === 'string') {
      register = await smartImport(join(cwd, register))
      listeners[index] = register
      registerType = typeof register
    }
    if (registerType !== 'function') {
      invalidListeners()
    }
    ++index
  }
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
    throwError(ERROR_CONFIG_INVALID_HTTP2_SETTING)
  }
  if (!configuration.http2) {
    configuration.http2 = false
  }
}

async function checkMappings (configuration) {
  const configurationInterface = new IConfiguration(configuration)
  configuration[$configurationInterface] = configurationInterface
  for (const mapping of configuration.mappings) {
    await checkMapping(configuration, mapping)
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

async function check (configuration) {
  if (typeof configuration !== 'object' || configuration === null) {
    throwError(ERROR_CONFIG_NOT_AN_OBJECT)
  }
  const checkedConfiguration = Object.assign({}, configuration)
  applyDefaults(checkedConfiguration)
  await setHandlers(checkedConfiguration)
  await checkListeners(checkedConfiguration)
  await checkProtocol(checkedConfiguration)
  await checkMappings(checkedConfiguration)
  checkedConfiguration[$configurationRequests] = {
    lastId: 0,
    holding: null,
    contexts: {}
  }
  return checkedConfiguration
}

async function read (fileName) {
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

module.exports = {
  checkHandler,
  check,
  read
}
