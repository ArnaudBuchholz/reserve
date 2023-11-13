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

module.exports = {
  // events
  EventEmitter,
  // fs
  createReadStream,
  readdir: promisify(readdir),
  readFile: promisify(readFile),
  stat: promisify(stat),
  // httpX
  http,
  http2,
  https,
  // os
  networkInterfaces,
  // path
  basename,
  dirname,
  isAbsolute,
  join,
  // stream
  pipeline,
  Duplex,
  Readable,
  // zlib
  zlib
}
