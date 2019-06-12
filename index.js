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

const configurationFilePath = path.join(process.cwd(), configurationFileName)
statAsync(configurationFilePath)
  .then(() => readFileAsync(configurationFilePath).then(buffer => JSON.parse(buffer.toString())))
  .catch(reason => {
    console.warn(`'${configurationFileName}' not found or invalid, applying defaults`.yellow)
    return {} // empty configuration will use all defaults
  })
  .then(configuration => {
    if (process.argv.includes('--verbose')) {
      configuration.verbose = true
    }
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
      .on('error', reason => {
        console.error('ERROR'.red, reason.toString().white)
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
