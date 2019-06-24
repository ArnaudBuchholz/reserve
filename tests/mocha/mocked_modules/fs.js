'use strict'

const path = require('path')
const Readable = require('stream').Readable

const entries = {
  'file': {
    content: 'binary'
  },
  'file.txt': {
    content: 'Hello World!'
  },
  'folder': {
    'index.html': {
      content: '<html />'
    }
  },
  'no-index': {}
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
          size: entry.content.length
        })
      } else {
        callback(null, {
          isDirectory: () => true
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
