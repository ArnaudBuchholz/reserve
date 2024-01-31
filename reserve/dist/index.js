'use strict'
const { createReadStream, readdir, readFile, stat } = require('fs')
const http = require('http')
const http2 = require('http2')
const https = require('https')
const { Socket } = require('net')
const { networkInterfaces } = require('os')
const { basename, dirname, isAbsolute, join } = require('path')
const { performance } = require('perf_hooks')
const { pipeline, Duplex, Readable } = require('stream')
const { promisify } = require('util')
const zlib = require('zlib')
const factory = require('./core.js')
module.exports = factory(
  createReadStream, readdir, readFile, stat,
  http,
  http2,
  https,
  Socket,
  networkInterfaces,
  basename, dirname, isAbsolute, join,
  performance,
  pipeline, Duplex, Readable,
  promisify,
  zlib
)
