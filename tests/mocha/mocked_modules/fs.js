'use strict'

const { join } = require('path')
const { readFileSync } = require('fs')
const Readable = require('stream').Readable

let fakeNow = new Date().getTime()
function fakeNowInMs () {
  fakeNow += 1000
  return fakeNow
}

const entries = {
  file: {
    content: 'binary'
  },
  'file.txt': {
    content: 'Hello World!',
    mtimeMs: new Date(Date.UTC(2020, 8, 30, 18, 51, 0, 0)).getTime()
  },
  'file$1.txt': {
    content: '$1'
  },
  'lorem ipsum.txt': {
    content: readFileSync(join(__dirname, '../lorem ipsum.txt'))
  },
  folder: {
    'index.html': {
      content: '<html />'
    },
    'privatekey.pem': {
      content: 'privatekey'
    },
    'certificate.pem': {
      content: 'certificate'
    },
    'reserve.json': {
      content: JSON.stringify({
        extend: '../reserve.json',
        ssl: {
          key: '/folder/privatekey.pem',
          cert: './certificate.pem'
        },
        mappings: [{
          match: '/folder/.*',
          url: 'https://secured.com/$1'
        }]
      })
    },
    'reserve-with-another-port.json': {
      content: JSON.stringify({
        port: 220103,
        extend: './reserve.json'
      })
    },
    'invalid-extend.json': {
      content: JSON.stringify({
        extend: './not-found'
      })
    },
    'reserve-relative-handler.json': {
      content: JSON.stringify({
        handlers: {
          test: './mocked-relative-handler.js'
        },
        mappings: [{
          match: '.*',
          test: '$1'
        }]
      })
    },
    'reserve-parent-handler.json': {
      content: JSON.stringify({
        handlers: {
          test: '../mocked-parent-handler.js'
        },
        mappings: [{
          match: '.*',
          test: '$1'
        }]
      })
    },
    'reserve-absolute-handler.json': {
      content: JSON.stringify({
        handlers: {
          test: 'mocked-absolute-handler'
        },
        mappings: [{
          match: '.*',
          test: '$1'
        }]
      })
    }
  },
  'reserve.json': {
    content: JSON.stringify({
      port: 3475,
      mappings: [{
        match: '/(.*)',
        file: '/$1'
      }]
    })
  },
  'no-index': {},
  'wrong-index': {
    'index.html': {}
  },
  'now.js': {
    content: ''
  },
  'not-now.js': {
    content: '',
    mtimeMs: fakeNowInMs()
  }
}

let caseSensitive = true
let ignoreEmptyFolders = false

function getEntry (entryPath) {
  if (!caseSensitive) {
    entryPath = entryPath.toLowerCase()
  }
  if (entryPath === '/') {
    return entries
  }
  return entryPath.split(/\\|\//).slice(1).reduce((folder, name) => {
    if (!folder || folder.content || (!name && ignoreEmptyFolders)) {
      return folder
    }
    return folder[name]
  }, entries)
}

require('mock-require')('fs', {

  setCaseSensitive (value) {
    caseSensitive = value
  },

  setIgnoreEmptyFolders (value) {
    ignoreEmptyFolders = value
  },

  stat (entryPath, callback) {
    const entry = getEntry(entryPath)
    if (entry) {
      const mtimeMs = entry.mtimeMs || fakeNowInMs()
      const mtime = new Date(mtimeMs)
      if (entry.content) {
        callback(null, {
          isDirectory: () => false,
          size: entry.content.length,
          mtimeMs,
          mtime
        })
      } else {
        callback(null, {
          isDirectory: () => true,
          mtimeMs,
          mtime
        })
      }
    } else {
      callback(new Error('not found'))
    }
  },

  createReadStream (entryPath, options) {
    const entry = getEntry(entryPath)
    const { start, end } = options
    let { content } = entry
    if (start !== undefined && end !== undefined) {
      content = content.substring(start, end + 1)
    }
    const stream = new Readable()
    stream._read = () => {
      stream.push(content)
      stream.push(null)
    }
    return stream
  },

  readFile (entryPath, callback) {
    const entry = getEntry(entryPath)
    if (entry) {
      callback(null, entry.content)
    } else {
      callback(new Error('not found'))
    }
  },

  readdir (entryPath, callback) {
    const entry = getEntry(entryPath)
    callback(null, Object.keys(entry))
  }
})
