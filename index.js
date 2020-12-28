#!/usr/bin/env node

'use strict'

const colors = require('./detect/colors')
const { read } = require('./configuration')
const log = require('./log')
const serve = require('./serve')

module.exports = {
  body: require('./body'),
  capture: require('./capture'),
  check: require('./configuration').check,
  interpolate: require('./interpolate'),
  log,
  mock: require('./mock'),
  read,
  serve
}

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
  const silent = process.argv.includes('--silent')

  read(configurationFileName)
    .catch(reason => {
      if (verbose) {
        console.error(colors.red(reason.toString()))
      }
      console.warn(colors.yellow(`'${configurationFileName}' not found or invalid, applying defaults`))
      return {} // empty configuration will use all defaults
    })
    .then(configuration => {
      let eventEmitter
      if (silent) {
        eventEmitter = serve(configuration)
      } else {
        eventEmitter = log(serve(configuration), verbose)
      }
      eventEmitter.on('ready', () => {
        if (process.send) {
          process.send('ready')
        }
      })
    })
}
