'use strict'

let fsPromises
try {
  fsPromises = require('fs/promises')
} catch (e) {
  fsPromises = require('fs').promises
}
const { readFile, stat } = fsPromises

module.exports = {
  readFile,
  stat
}