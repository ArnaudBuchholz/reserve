'use strict'

const { check, read } = require('./configuration')

module.exports = {
  Request: require('./mock/Request'),
  Response: require('./mock/Response'),
  body: require('./body'),
  capture: require('./capture'),
  check,
  colors: require('./detect/colors'),
  interpolate: require('./interpolate'),
  log: require('./log'),
  mock: require('./mock'),
  read,
  serve: require('./serve')
}
