'use strict'

const util = require('util')
const engine = require('./engine')
const fs = require('fs')
const path = require('path')

const statAsync = util.promisify(fs.stat)
const readFileAsync = util.promisify(fs.readFile)

const localConfiguration = path.join(process.cwd(), 'reserve.json')
statAsync(localConfiguration)
  .then(() => {
    return readFileAsync(localConfiguration)
  }, () => {
    return readFileAsync(path.join(__dirname, 'default.json'))
  })
  .then(buffer => JSON.parse(buffer.toString()))
  .then(configuration => {
    // Validate & process
  })
  .then(configuration => {
      engine(configuration)
  })
