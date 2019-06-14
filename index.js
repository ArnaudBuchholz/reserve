'use strict'

/* global process */

require('colors')
const util = require('util')
const serve = require('./serve')
const fs = require('fs')
const path = require('path')

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
  configuration.mappings.forEach(mapping => {
    if (!mapping._path) {
      mapping._path = configurationFolderPath
    }
  })
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

const configurationFilePath = path.join(process.cwd(), configurationFileName)
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
  .then(configuration => {
    serve(configuration)
      .on('ready', ({ url }) => {
        console.log(`Server running at ${url}`.yellow)
        if (process.send) {
          process.send('ready')
        }
      })
      .on('error', ({ method, url, reason }) => {
        if (method && url) {
          console.error('ERROR'.red, method.gray, url.gray, '\n\\____'.red, reason.toString().gray)
        } else {
          console.error('ERROR'.red, reason.toString().gray)
        }
      })
      .on('redirected', ({ method, url, statusCode, timeSpent }) => {
        let report
        if (statusCode > 399) {
          report = statusCode.toString().red
        } else {
          report = statusCode.toString().green
        }
        report += ` ${timeSpent} ms`.magenta
        console.log('SERVE'.magenta, method.gray, url.gray, report)
      })
  })
