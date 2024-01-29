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

module.exports = {
  // fs
  createReadStream,
  readdir: promisify(readdir),
  readFile: promisify(readFile),
  stat: promisify(stat),
  // httpX
  http,
  http2,
  https,
  // net
  Socket,
  // os
  networkInterfaces,
  // path
  basename,
  dirname,
  isAbsolute,
  join,
  // perf_hooks
  performance,
  // stream
  pipeline,
  Duplex,
  Readable,
  // zlib
  zlib
}
