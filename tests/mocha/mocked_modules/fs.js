'use strict'

const path = require('path')
const Readable = require('stream').Readable

let fakeNow = 0
function fakeNowInMs () {
  return ++fakeNow
}

const entries = {
  file: {
    content: 'binary'
  },
  'file.txt': {
    content: 'Hello World!'
  },
  'file$1.txt': {
    content: '$1'
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
  'now.js': {
    content: ''
  },
  'not-now.js': {
    content: '',
    mtimeMs: fakeNowInMs()
  }
}

function getEntry (entryPath) {
  return entryPath.split(path.sep).slice(1).reduce((folder, name) => {
    if (!folder || folder.content) {
      return folder
    }
    return folder[name]
  }, entries)
}

require('mock-require')('fs', {

  stat (entryPath, callback) {
    const entry = getEntry(entryPath)
    if (entry) {
      if (entry.content) {
        callback(null, {
          isDirectory: () => false,
          size: entry.content.length,
          mtimeMs: entry.mtimeMs || fakeNowInMs()
        })
      } else {
        callback(null, {
          isDirectory: () => true,
          mtimeMs: entry.mtimeMs || fakeNowInMs()
        })
      }
    } else {
      callback(new Error('not found'))
    }
  },

  createReadStream (entryPath) {
    const entry = getEntry(entryPath)
    const stream = new Readable()
    let contentSent = false
    stream._read = () => {
      if (contentSent) {
        stream.push(null)
      } else {
        stream.push(entry.content)
      }
      contentSent = true
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
  }
})
