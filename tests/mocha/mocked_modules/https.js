'use strict'

require('mock-require')('https', {
  request: require('../http').request
})
