'use strict'

/* global process */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

require('colors')
const util = require('util')
const serve = require('./serve')
const fs = require('fs')
const path = require('path')
const log = require('./log')

const statAsync = util.promisify(fs.stat)
const readFileAsync = util.promisify(fs.readFile)

const configurationFileName = process.argv.reduce((name, parameter) => {
  if (parameter === '--config') {
    return false
  }
  if (name === false) {
    return parameter
  }
  return name
}, '') || 'reserve.json'

function extend (configurationFilePath, configuration) {
  const configurationFolderPath = path.dirname(configurationFilePath)
  if (configuration.mappings) {
    configuration.mappings.forEach(mapping => {
      if (!mapping._path) {
        mapping._path = configurationFolderPath
      }
    })
  }
  if (configuration.extend) {
    const baseConfigurationFilePath = path.join(configurationFolderPath, configuration.extend)
    delete configuration.extend
    return readFileAsync(baseConfigurationFilePath)
      .then(buffer => JSON.parse(buffer.toString()))
      .then(baseConfiguration => {
        // Only merge mappings
        const baseMappings = baseConfiguration.mappings
        const mergedConfiguration = Object.assign(baseConfiguration, configuration)
        if (baseMappings !== mergedConfiguration.mappings) {
          mergedConfiguration.mappings = [...configuration.mappings, baseMappings]
        }
        return extend(baseConfigurationFilePath, mergedConfiguration)
      })
  }
  return configuration
}

let configurationFilePath
if (path.isAbsolute(configurationFileName)) {
  configurationFilePath = configurationFileName
} else {
  configurationFilePath = path.join(process.cwd(), configurationFileName)
}
statAsync(configurationFilePath)
  .then(() => readFileAsync(configurationFilePath).then(buffer => JSON.parse(buffer.toString())))
  .then(configuration => extend(configurationFilePath, configuration))
  .catch(reason => {
    console.warn(`'${configurationFileName}' not found or invalid, applying defaults`.yellow)
    return {} // empty configuration will use all defaults
  })
  .then(configuration => {
    if (process.argv.includes('--verbose')) {
      configuration.verbose = true
    }
    configuration._json = true
    return configuration
  })
  .then(configuration => log(serve(configuration), configuration.verbose))
