'use strict'

const fs = require('fs')
const path = require('path')
const util = require('util')

const statAsync = util.promisify(fs.stat)
const readFileAsync = util.promisify(fs.readFile)

const defaults = {
  hostname: '127.0.0.1',
  port: 5000,
  mappings: [{
    match: /^\/proxy\/(https?)\/(.*)/,
    url: '$1://$2',
    'unsecure-cookies': true
  }, {
    match: '(.*)',
    file: './$1'
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
    configuration.handlers = Object.assign({}, configuration.handlers, defaultHandlers)
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
    return readFileAsync(configuration.ssl.cert)
      .then(buffer => {
        configuration.ssl.cert = buffer.toString()
        return readFileAsync(configuration.ssl.key)
      })
      .then(buffer => {
        configuration.ssl.key = buffer.toString()
      })
  } else {
    configuration.protocol = 'http'
  }
}

function checkMappings (configuration) {
  configuration.mappings.forEach(mapping => {
    if (typeof mapping.match === 'string') {
      if (!mapping._path) {
        mapping._path = process.cwd()
      }
      mapping.match = new RegExp(mapping.match)
      const { handler } = configuration.handler(mapping)
      if (!handler) {
        throw new Error('Unknown handler for mapping: ' + JSON.stringify(mapping))
      }
      if (handler.schema.custom === 'function' && typeof mapping.custom === 'string') {
        mapping.custom = require(path.join(mapping._path, mapping.custom))
      }
    }
  })
}

function extend (filePath, configuration) {
  const folderPath = path.dirname(filePath)
  if (configuration.mappings) {
    configuration.mappings.forEach(mapping => {
      if (!mapping._path) {
        mapping._path = folderPath
      }
    })
  }
  if (configuration.extend) {
    const basefilePath = path.join(folderPath, configuration.extend)
    delete configuration.extend
    return readFileAsync(basefilePath)
      .then(buffer => JSON.parse(buffer.toString()))
      .then(baseConfiguration => {
        // Only merge mappings
        const baseMappings = baseConfiguration.mappings
        const mergedConfiguration = Object.assign(baseConfiguration, configuration)
        if (baseMappings !== mergedConfiguration.mappings) {
          mergedConfiguration.mappings = [...configuration.mappings, baseMappings]
        }
        return extend(basefilePath, mergedConfiguration)
      })
  }
  return configuration
}

module.exports = {
  async check (configuration, defaultHandlers) {
    const checkedConfiguration = Object.assign({}, configuration)
    applyDefaults(checkedConfiguration)
    setHandlers(checkedConfiguration, defaultHandlers)
    await checkProtocol(checkedConfiguration)
    checkMappings(checkedConfiguration)
    return checkedConfiguration
  },

  async read (fileName) {
    let filePath
    if (path.isAbsolute(fileName)) {
      filePath = fileName
    } else {
      filePath = path.join(process.cwd(), fileName)
    }
    return statAsync(filePath)
      .then(() => readFileAsync(filePath).then(buffer => JSON.parse(buffer.toString())))
      .then(configuration => extend(filePath, configuration))
  }
}
