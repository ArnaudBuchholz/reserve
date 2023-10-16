'use strict'

const EventEmitter = require('events')
const { readFile, stat } = require('fs')
const { dirname, isAbsolute, join } = require('path')
const { pipeline, Duplex, Readable } = require('stream')
const { promisify } = require('util')
const zlib = require('zlib')

let colors
try {
  colors = require('colors/safe')
} catch (e) {}

let mime
try {
  mime = require('mime')
} catch (e) {}
if (mime && !mime.getType && mime.lookup) {
  const mimeV1 = mime
  mime = {
    getType: extension => mimeV1.lookup(extension)
  }
}

module.exports = {
  // colors
  colors,
  // events
  EventEmitter,
  // fs
  readFile: promisify(readFile),
  stat: promisify(stat),
  // mime
  mime,
  // path
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
