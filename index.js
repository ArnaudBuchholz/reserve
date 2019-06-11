'use strict'

require('colors')
const util = require('util')
const serve = require('./serve')
const fs = require('fs')
const path = require('path')

const statAsync = util.promisify(fs.stat)
const readFileAsync = util.promisify(fs.readFile)

const localConfigurationFile = path.join(process.cwd(), 'reserve.json')
statAsync(localConfigurationFile)
  .then(() => readFileAsync(localConfigurationFile).then(buffer => JSON.parse(buffer.toString())))
  .catch(reason => {
    console.warn('No or invalid local configuration found, applying defaults'.yellow)
    return {} // empty configuration will use all defaults
  })
  .then(configuration => {
    serve(configuration)
      .on('error', reason => {
        console.error('ERROR'.red, reason.toString().white)
      })
      .on('incoming', ({method, url}) => {
        console.error('INCOMING'.magenta, method.gray, url.gray)
      })
  })
