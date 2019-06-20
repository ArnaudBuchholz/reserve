'use strict'

const entries = {
  '/file': {
    content: 'Hello World!'
  }
}

require('mock-require')('fs', {

  stat: (path, callback) => {
    const entry = entries[path]
    if (entry) {
      if (entry.content) {
        callback(0, {
          isDirectory: () => false,
          size: entry.content.length
        })
      }
    } else {
      callback(new Error('not found'))
    }
  }

})
