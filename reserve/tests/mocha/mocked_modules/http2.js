'use strict'

const { request, createServer } = require('../http')

require('mock-require')('http2', {
  request,
  createServer,
  createSecureServer: createServer
})
