'use strict'

const { read } = require('./configuration')
const log = require('./log')
const serve = require('./serve')

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
