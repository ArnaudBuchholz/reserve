'use strict'

const { readFile, stat } = require('fs')
const { promisify } = require('util')
const { dirname, isAbsolute, join } = require('path')
const { Duplex, Readable } = require('stream')

module.exports = {
  // fs
  readFile: promisify(readFile),
  stat: promisify(stat),
  // path
  dirname,
  isAbsolute,
  join,
  // stream
  Duplex,
  Readable
}
