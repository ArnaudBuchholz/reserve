'use strict'

const { request, createServer } = require('../http')

require('mock-require')('http', {
  request,
  createServer
})
