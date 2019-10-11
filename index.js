#!/usr/bin/env node

'use strict'

const { read } = require('./configuration')
const log = require('./log')
const serve = require('./serve')

/* istanbul ignore if */ // Only used for command line
if (require.main === module) {
  const configurationFileName = process.argv.reduce((name, parameter) => {
    if (parameter === '--config') {
      return false
    }
    if (name === false) {
      return parameter
    }
    return name
  }, '') || 'reserve.json'

  const verbose = process.argv.includes('--verbose')

  read(configurationFileName)
    .catch(reason => {
      if (verbose) {
        console.error(reason.toString().red)
      }
      console.warn(`'${configurationFileName}' not found or invalid, applying defaults`.yellow)
      return {} // empty configuration will use all defaults
    })
    .then(configuration => {
      log(serve(configuration), verbose)
        .on('ready', () => {
          if (process.send) {
            process.send('ready')
          }
        })
    })
} else {
  module.exports = {
    check: require('./configuration').check,
    log,
    mock: require('./mock'),
    read,
    serve
  }
}
