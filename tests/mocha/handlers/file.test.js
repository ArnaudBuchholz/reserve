'use strict'

const assert = require('../assert')
const mime = require('../../../detect/mime')
const fileHandler = require('../../../handlers/file')
const handle = require('./handle')(fileHandler, { mapping: { cwd: '/' } })
const fs = require('fs')
const { promisify } = require('util')
const mockRequire = require('mock-require')

const textMimeType = mime.getType('text')
const htmlMimeType = mime.getType('html')
const defaultMimeType = mime.getType('bin')

describe('handlers/file', () => {
  it('returns a promise', () => handle('./file.txt')
    .then(({ promise }) => {
      assert(() => typeof promise.then === 'function')
    })
  )

  it('pipes file content (relative path)', () => handle({
    request: './file.txt'
  })
    .then(({ promise, response }) => promise.then(value => {
      assert(() => value === undefined)
      assert(() => response.statusCode === 200)
      assert(() => response.headers['Content-Type'] === textMimeType)
      assert(() => response.toString() === 'Hello World!')
    }))
  )

  it('pipes file content (absolute path)', () => handle({
    request: '/file.txt',
    mapping: {
      cwd: '/folder'
    }
  })
    .then(({ promise, response }) => promise.then(value => {
      assert(() => value === undefined)
      assert(() => response.statusCode === 200)
      assert(() => response.headers['Content-Type'] === textMimeType)
      assert(() => response.toString() === 'Hello World!')
    }))
  )

  it('pipes file content (trim parameters)', () => handle({
    request: '/file.txt?param=1#hash'
  })
    .then(({ promise, response }) => promise.then(value => {
      assert(() => value === undefined)
      assert(() => response.statusCode === 200)
      assert(() => response.headers['Content-Type'] === textMimeType)
      assert(() => response.toString() === 'Hello World!')
    }))
  )

  it('checks file access (url must *not* end with /)', () => handle({
    request: './file.txt/'
  })
    .then(({ promise, response }) => promise.then(value => {
      assert(() => value === 404)
    }))
  )

  it('checks folder access (url must end with /)', () => handle({
    request: './folder'
  })
    .then(({ promise, response }) => promise.then(value => {
      assert(() => value === 404)
    }))
  )

  it('sends index.html if accessing a folder', () => handle({
    request: './folder/'
  })
    .then(({ promise, response }) => promise.then(value => {
      assert(() => value === undefined)
      assert(() => response.statusCode === 200)
      assert(() => response.headers['Content-Type'] === htmlMimeType)
      assert(() => response.headers['Content-Length'] === 8)
      assert(() => response.toString() === '<html />')
    }))
  )

  it('sends index.html if accessing a folder (HEAD)', () => handle({
    request: {
      method: 'HEAD',
      url: './folder/'
    }
  })
    .then(({ promise, response }) => promise.then(value => {
      assert(() => value === undefined)
      assert(() => response.statusCode === 200)
      assert(() => response.headers['Content-Type'] === htmlMimeType)
      assert(() => response.headers['Content-Length'] === 8)
      assert(() => response.toString() === '')
    }))
  )

  it('defaults mimetype when no extension', () => handle({
    request: './file'
  })
    .then(({ promise, response }) => promise.then(value => {
      assert(() => value === undefined)
      assert(() => response.statusCode === 200)
      assert(() => response.headers['Content-Type'] === defaultMimeType)
      assert(() => response.toString() === 'binary')
    }))
  )

  it('fails with 404 if the file does not exist', () => handle({
    request: './not-found'
  })
    .then(({ promise }) => promise.then(value => {
      assert(() => value === 404)
    }))
  )

  it('fails with 404 if the folder does not exist', () => handle({
    request: './not-a-folder/not-found'
  })
    .then(({ promise }) => promise.then(value => {
      assert(() => value === 404)
    }))
  )

  it('fails with 404 if the folder does not have index.html', () => handle({
    request: './no-index/'
  })
    .then(({ promise }) => promise.then(value => {
      assert(() => value === 404)
    }))
  )

  it('fails with 404 if the folder contains a sub folder named index.html', () => handle({
    request: './wrong-index/'
  })
    .then(({ promise }) => promise.then(value => {
      assert(() => value === 404)
    }))
  )

  describe('Case insensitive file system', function () {
    before(() => {
      fs.setCaseSensitive(false)
    })

    it('finds the file even if the file name does not match case sensitively', () => handle({
      request: '/File.txt'
    })
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === undefined)
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.headers['Content-Length'] === 12)
        assert(() => response.toString() === 'Hello World!')
      }))
    )

    it('finds the file even if the file name does not match case sensitively (HEAD)', () => handle({
      request: {
        method: 'HEAD',
        url: '/File.txt'
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === undefined)
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.headers['Content-Length'] === 12)
        assert(() => response.toString() === '')
      }))
    )

    it('fails with 404 if the file name does not match case sensitively but case-sensitive is set', () => handle({
      request: '/File.txt',
      mapping: {
        cwd: '/',
        'case-sensitive': true
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === 404)
      }))
    )

    it('finds the file case sensitively when requested', () => handle({
      request: '/file.txt',
      mapping: {
        cwd: '/',
        'case-sensitive': true
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === undefined)
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.headers['Content-Length'] === 12)
        assert(() => response.toString() === 'Hello World!')
      }))
    )

    it('finds the file case sensitively when requested (HEAD)', () => handle({
      request: {
        method: 'HEAD',
        url: '/file.txt'
      },
      mapping: {
        cwd: '/',
        'case-sensitive': true
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === undefined)
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.headers['Content-Length'] === 12)
        assert(() => response.toString() === '')
      }))
    )

    it('fails with 404 if the file name does not match case sensitively but case-sensitive is set (folder)', () => handle({
      request: '/Folder/index.html',
      mapping: {
        cwd: '/',
        'case-sensitive': true
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === 404)
      }))
    )

    it('finds the file case sensitively when requested (folder)', () => handle({
      request: '/folder/index.html',
      mapping: {
        cwd: '/',
        'case-sensitive': true
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === undefined)
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === htmlMimeType)
        assert(() => response.toString() === '<html />')
      }))
    )

    after(() => {
      fs.setCaseSensitive(true)
    })
  })

  describe('ignore-if-not-found', function () {
    it('does not fail with 404 if the file does not exist', () => handle({
      request: './not-found',
      mapping: {
        cwd: '/',
        'ignore-if-not-found': true
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === undefined)
        assert(() => response.isInitial())
      }))
    )

    it('does not fail with 404 if the folder does not exist', () => handle({
      request: './not-a-folder/not-found',
      mapping: {
        cwd: '/',
        'ignore-if-not-found': true
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === undefined)
        assert(() => response.isInitial())
      }))
    )

    it('still fails for incorrect folder access (url must end with /)', () => handle({
      request: './folder',
      mapping: {
        cwd: '/',
        'ignore-if-not-found': true
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === 404)
      }))
    )

    it('does not fail with 404 if the folder does not have index.html', () => handle({
      request: './no-index/',
      mapping: {
        cwd: '/',
        'ignore-if-not-found': true
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === undefined)
        assert(() => response.isInitial())
      }))
    )
  })

  describe('custom file system', () => {
    const customFs = {
      stat: promisify(fs.stat),
      readdir: promisify(fs.readdir),
      createReadStream: (path, options) => Promise.resolve(fs.createReadStream(path, options))
    }

    it('allows external module', () => {
      mockRequire('/cfs.js', customFs)
      return handle({
        request: './file.txt',
        mapping: {
          'custom-file-system': '/cfs.js'
        }
      })
        .then(({ promise, response }) => promise.then(value => {
          assert(() => value === undefined)
          assert(() => response.statusCode === 200)
          assert(() => response.headers['Content-Type'] === textMimeType)
          assert(() => response.toString() === 'Hello World!')
        }))
    })

    it('validates custom file system methods', () => handle({
      request: './file.txt',
      mapping: {
        'custom-file-system': {
          stat: 0,
          readdir: promisify(fs.readdir)
        }
      }
    })
      .then(assert.notExpected, reason => {
        assert(() => !!reason)
      })
    )
  })

  describe('range request', () => {
    it('supports range request', () => handle({
      request: './file.txt'
    })
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === undefined)
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Accept-Ranges'] === 'bytes')
        assert(() => response.headers['Content-Range'] === undefined)
        assert(() => response.toString() === 'Hello World!')
      }))
    )

    it('does not support multipart range request', () => handle({
      request: {
        method: 'GET',
        url: './file.txt',
        headers: {
          Range: 'bytes=0-2,5-6'
        }
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === undefined)
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.toString() === 'Hello World!')
      }))
    )

    it('returns only the request bytes (start)', () => handle({
      request: {
        method: 'GET',
        url: './file.txt',
        headers: {
          range: 'bytes=0-4'
        }
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === undefined)
        assert(() => response.statusCode === 206)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.headers['Content-Range'] === 'bytes 0-4/12')
        assert(() => response.headers['Content-Length'] === 5)
        assert(() => response.toString() === 'Hello')
      }))
    )

    it('returns only the request bytes (middle)', () => handle({
      request: {
        method: 'GET',
        url: './file.txt',
        headers: {
          range: 'bytes=6-10'
        }
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === undefined)
        assert(() => response.statusCode === 206)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.headers['Content-Range'] === 'bytes 6-10/12')
        assert(() => response.headers['Content-Length'] === 5)
        assert(() => response.toString() === 'World')
      }))
    )

    it('returns only the request bytes (end)', () => handle({
      request: {
        method: 'GET',
        url: './file.txt',
        headers: {
          range: 'bytes=6-'
        }
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === undefined)
        assert(() => response.statusCode === 206)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.headers['Content-Range'] === 'bytes 6-11/12')
        assert(() => response.headers['Content-Length'] === 6)
        assert(() => response.toString() === 'World!')
      }))
    )

    it('fails with invalid range (start over the file size)', () => handle({
      request: {
        method: 'GET',
        url: './file.txt',
        headers: {
          range: 'bytes=12-'
        }
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === undefined)
        assert(() => response.statusCode === 416)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.headers['Content-Length'] === 0)
        assert(() => response.toString() === '')
      }))
    )

    it('fails with invalid range (start over end)', () => handle({
      request: {
        method: 'GET',
        url: './file.txt',
        headers: {
          range: 'bytes=5-2'
        }
      }
    })
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === undefined)
        assert(() => response.statusCode === 416)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.headers['Content-Length'] === 0)
        assert(() => response.toString() === '')
      }))
    )
  })

  describe('request abortion', () => {
    it('stops transfer if request is aborted', () => handle({
      request: {
        method: 'GET',
        url: './file.txt'
      }
    })
      .then(({ promise, request, response }) => {
        request.abort()
        return promise
          .then(value => {
            assert(() => value === undefined)
            assert(() => response.statusCode === 200)
            assert(() => response.headers['Content-Type'] === textMimeType)
            assert(() => response.headers['Content-Length'] === 12)
            assert(() => response.toString() === '')
          })
      })
    )

    it('stops transfer if request is aborted (after createReadStream)', () => {
      let allocatedRequest
      const customFs = {
        stat: promisify(fs.stat),
        readdir: promisify(fs.readdir),
        createReadStream: (path, options) => {
          allocatedRequest.abort()
          return Promise.resolve(fs.createReadStream(path, options))
        }
      }
      return handle({
        request: {
          method: 'GET',
          url: './file.txt'
        },
        mapping: {
          'custom-file-system': customFs
        }
      })
        .then(({ promise, request, response }) => {
          allocatedRequest = request
          return promise
            .then(value => {
              assert(() => value === undefined)
              assert(() => response.statusCode === 200)
              assert(() => response.headers['Content-Type'] === textMimeType)
              assert(() => response.headers['Content-Length'] === 12)
              assert(() => response.toString() === '')
            })
        })
    })
  })
})
