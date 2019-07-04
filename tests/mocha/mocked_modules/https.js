'use strict'

const { request, createServer } = require('../http')

require('mock-require')('https', {
  request,
  createServer
})
