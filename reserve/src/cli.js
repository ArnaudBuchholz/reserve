#!/usr/bin/env node

const { log, read, serve } = require('./index.js')

const configurationFileNames = process.argv.reduce((name, parameter) => {
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
configurationFileNames.split(',').forEach(configurationFileName => {
  read(configurationFileName)
    .catch(reason => {
      if (verbose) {
        console.error(reason.toString())
      }
      console.warn(`'${configurationFileName}' not found or invalid, applying defaults`)
      return {} // empty configuration will use all defaults
    })
    .then(configuration => {
      let server
      if (silent) {
        server = serve(configuration)
      } else {
        server = log(serve(configuration), verbose)
      }
      server.on('ready', () => {
        if (process.send) {
          process.send('ready')
        }
      })
    })
})
