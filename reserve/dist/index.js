'use strict'
const EventEmitter = require('events')
const { createReadStream, readdir, readFile, stat } = require('fs')
const http = require('http')
const http2 = require('http2')
const https = require('https')
const { networkInterfaces } = require('os')
const { basename, dirname, isAbsolute, join } = require('path')
const { pipeline, Duplex, Readable } = require('stream')
const { promisify } = require('util')
const zlib = require('zlib')
const factory = require('./core.js')
module.exports = factory({
  EventEmitter,
  createReadStream, readdir, readFile, stat,
  http,
  http2,
  https,
  networkInterfaces,
  basename, dirname, isAbsolute, join,
  pipeline, Duplex, Readable,
  promisify,
  zlib
})