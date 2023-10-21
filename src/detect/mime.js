'use strict'

const { mime } = require('../dependencies')

const app = 'application'
const html = 'text/html'
const jpeg = 'image/jpeg'
const text = 'text/plain'

const hardcodedMimeTypes = {
  bin: `${app}/octet-stream`,
  css: 'text/css',
  gif: 'image/gif',
  html,
  htm: html,
  jpeg,
  jpg: jpeg,
  js: `${app}/javascript`,
  json: `${app}/json`,
  mp4: 'video/mp4',
  pdf: `${app}/pdf`,
  png: 'image/png',
  svg: 'image/svg+xml',
  text,
  txt: text,
  xml: `${app}/xml`
}

if (mime) {
  module.exports = mime.getType
} else {
  module.exports = extension => hardcodedMimeTypes[extension]
}
