'use strict'

require('mock-require')('http', {
  request: require('../http').request
})
