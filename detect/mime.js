'use strict'

let mime

try {
  mime = require('mime')
} catch (e) {}

const app = 'application'
const html = 'text/html'
const jpeg = 'image/jpeg'
const text = 'text/plain'

const types = {
  bin: `${app}/octet-stream`,
  css: 'text/css',
  gif: 'image/gif',
  html,
  htm: html,
  jpeg,
  jpg: jpeg,
  js: `${app}/javascript`,
  mp4: 'video/mp4',
  pdf: `${app}/pdf`,
  png: 'image/png',
  svg: 'image/svg+xml',
  text,
  txt: text,
  xml: `${app}/xml`
}

module.exports = mime || {
  getType: extension => {
    if (extension.charAt(0) === '.') {
      extension = extension.substring(1)
    }
    return types[extension] || types.bin
  }
}
