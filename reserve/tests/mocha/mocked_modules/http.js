'use strict'

const http = require('http')
const { request, createServer } = require('../http')

require('mock-require')('http', {
  request,
  createServer,
  __unmocked__: http
})
