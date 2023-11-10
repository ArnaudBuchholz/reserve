'use strict'

const { writeFileSync } = require('fs')
const { join } = require('path')
const mimeTypes = require(join(__dirname, '../src/mime.json'))
const verbose = !process.argv.includes('--silent')

const tokens = [
  'openxmlformats',
  'application/',
  'octet-stream',
  'presentation',
  'document',
  'office',
  'image/',
  'audio/',
  'video/',
  'text/',
  'font/',
  'oasis',
  'woff',
  'vnd.',
  'xml',
  'zip',
  'x-'
]

function * encode () {
  let lastMime
  for (const type in mimeTypes) {
    if (lastMime !== undefined) {
      yield ','
    }
    const mime = mimeTypes[type].replace(new RegExp(tokens.join('|'), 'g'), match => String.fromCharCode(65 + tokens.indexOf(match)))
    if (mime !== lastMime) {
      lastMime = mime
      yield `${type}=${mime}`
    } else {
      yield `${type}`
    }
  }
}

const encoded = [...encode()].join('')
if (verbose) {
  console.log('Compression done', encoded.length, encoded)
}

writeFileSync(join(__dirname, '../src/mime.js'), `'use strict'

const mimeTypes = {}

const tokens = '${tokens.join(',')}'.split(',')
let source = '${encoded}'
tokens.forEach((token, index) => {
  source = source.replace(new RegExp(String.fromCharCode(65 + index), 'g'), token)
})
let lastMimeType
source.split(',').forEach(line => {
  const [type, mimeType] = line.split('=')
  if (mimeType) {
    lastMimeType = mimeType
  }
  mimeTypes[type] = lastMimeType
})

module.exports = mimeTypes
`)

if (verbose) {
  console.log(require('../src/mime.js'))
}
