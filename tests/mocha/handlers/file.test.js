'use strict'

const assert = require('../assert')
const mime = require('../../../detect/mime')
const Request = require('../../../mock/Request')
const Response = require('../../../mock/Response')
const fileHandler = require('../../../handlers/file')
const fs = require('fs')

const textMimeType = mime.getType('text')
const htmlMimeType = mime.getType('html')
const defaultMimeType = mime.getType('bin')

describe('handlers/file', () => {
  it('returns a promise', () => {
    const request = new Request()
    const response = new Response()
    const result = fileHandler.redirect({
      request,
      response,
      mapping: {
        cwd: '/'
      },
      redirect: './file.txt'
    })
    assert(() => typeof result.then === 'function')
  })

  it('pipes file content (relative path)', () => {
    const request = new Request()
    const response = new Response()
    return fileHandler.redirect({
      request,
      response,
      mapping: {
        cwd: '/'
      },
      redirect: './file.txt'
    })
      .then(value => {
        assert(() => value === undefined)
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.toString() === 'Hello World!')
      })
  })

  it('pipes file content (absolute path)', () => {
    const request = new Request()
    const response = new Response()
    return fileHandler.redirect({
      request,
      response,
      mapping: {
        cwd: '/folder'
      },
      redirect: '/file.txt'
    })
      .then(value => {
        assert(() => value === undefined)
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.toString() === 'Hello World!')
      })
  })

  it('pipes file content (trim parameters)', () => {
    const request = new Request()
    const response = new Response()
    return fileHandler.redirect({
      request,
      response,
      mapping: {
        cwd: '/'
      },
      redirect: '/file.txt?param=1#hash'
    })
      .then(value => {
        assert(() => value === undefined)
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.toString() === 'Hello World!')
      })
  })

  it('checks file access (url must *not* end with /)', () => {
    const request = new Request()
    const response = new Response()
    return fileHandler.redirect({
      request,
      response,
      mapping: {
        cwd: '/'
      },
      redirect: './file.txt/'
    })
      .then(value => {
        assert(() => value === 404)
      })
  })

  it('checks folder access (url must end with /)', () => {
    const request = new Request()
    const response = new Response()
    return fileHandler.redirect({
      request,
      response,
      mapping: {
        cwd: '/'
      },
      redirect: './folder'
    })
      .then(value => {
        assert(() => value === 404)
      })
  })

  it('sends index.html if accessing a folder', () => {
    const request = new Request()
    const response = new Response()
    return fileHandler.redirect({
      request,
      response,
      mapping: {
        cwd: '/'
      },
      redirect: './folder/'
    })
      .then(value => {
        assert(() => value === undefined)
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === htmlMimeType)
        assert(() => response.toString() === '<html />')
      })
  })

  it('defaults mimetype when no extension', () => {
    const request = new Request()
    const response = new Response()
    return fileHandler.redirect({
      request,
      response,
      mapping: {
        cwd: '/'
      },
      redirect: './file'
    })
      .then(value => {
        assert(() => value === undefined)
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === defaultMimeType)
        assert(() => response.toString() === 'binary')
      })
  })

  it('fails with 404 if the file does not exist', () => {
    const request = new Request()
    const response = new Response()
    return fileHandler.redirect({
      request,
      response,
      mapping: {
        cwd: '/'
      },
      redirect: './not-found'
    })
      .then(value => {
        assert(() => value === 404)
      })
  })

  it('fails with 404 if the folder does not exist', () => {
    const request = new Request()
    const response = new Response()
    return fileHandler.redirect({
      request,
      response,
      mapping: {
        cwd: '/'
      },
      redirect: './not-a-folder/not-found'
    })
      .then(value => {
        assert(() => value === 404)
      })
  })

  it('fails with 404 if the folder does not have index.html', () => {
    const request = new Request()
    const response = new Response()
    return fileHandler.redirect({
      request,
      response,
      mapping: {
        cwd: '/'
      },
      redirect: './no-index/'
    })
      .then(value => {
        assert(() => value === 404)
      })
  })

  describe('Case insensitive file system', function () {
    before(() => {
      fs.setCaseSensitive(false)
    })

    it('finds the file even if the file name does not match case sensitively', () => {
      const request = new Request()
      const response = new Response()
      return fileHandler.redirect({
        request,
        response,
        mapping: {
          cwd: '/'
        },
        redirect: '/File.txt'
      })
        .then(value => {
          assert(() => value === undefined)
          assert(() => response.statusCode === 200)
          assert(() => response.headers['Content-Type'] === textMimeType)
          assert(() => response.headers['Content-Length'] === 12)
          assert(() => response.toString() === 'Hello World!')
        })
    })

    it('finds the file even if the file name does not match case sensitively (HEAD)', () => {
      const request = new Request('HEAD')
      const response = new Response()
      return fileHandler.redirect({
        request,
        response,
        mapping: {
          cwd: '/'
        },
        redirect: '/File.txt'
      })
        .then(value => {
          assert(() => value === undefined)
          assert(() => response.statusCode === 200)
          assert(() => response.headers['Content-Type'] === textMimeType)
          assert(() => response.headers['Content-Length'] === 12)
          assert(() => response.toString() === '')
        })
    })

    it('fails with 404 if the file name does not match case sensitively but case-sensitive is set', () => {
      const request = new Request()
      const response = new Response()
      return fileHandler.redirect({
        request,
        response,
        mapping: {
          cwd: '/',
          'case-sensitive': true
        },
        redirect: '/File.txt'
      })
        .then(value => {
          assert(() => value === 404)
        })
    })

    it('finds the file case sensitively when requested', () => {
      const request = new Request()
      const response = new Response()
      return fileHandler.redirect({
        request,
        response,
        mapping: {
          cwd: '/',
          'case-sensitive': true
        },
        redirect: '/file.txt'
      })
        .then(value => {
          assert(() => value === undefined)
          assert(() => response.statusCode === 200)
          assert(() => response.headers['Content-Type'] === textMimeType)
          assert(() => response.headers['Content-Length'] === 12)
          assert(() => response.toString() === 'Hello World!')
        })
    })

    it('finds the file case sensitively when requested (HEAD)', () => {
      const request = new Request('HEAD')
      const response = new Response()
      return fileHandler.redirect({
        request,
        response,
        mapping: {
          cwd: '/',
          'case-sensitive': true
        },
        redirect: '/file.txt'
      })
        .then(value => {
          assert(() => value === undefined)
          assert(() => response.statusCode === 200)
          assert(() => response.headers['Content-Type'] === textMimeType)
          assert(() => response.headers['Content-Length'] === 12)
          assert(() => response.toString() === '')
        })
    })

    it('fails with 404 if the file name does not match case sensitively but case-sensitive is set (folder)', () => {
      const request = new Request()
      const response = new Response()
      return fileHandler.redirect({
        request,
        response,
        mapping: {
          cwd: '/',
          'case-sensitive': true
        },
        redirect: '/Folder/index.html'
      })
        .then(value => {
          assert(() => value === 404)
        })
    })

    it('finds the file case sensitively when requested (folder)', () => {
      const request = new Request()
      const response = new Response()
      return fileHandler.redirect({
        request,
        response,
        mapping: {
          cwd: '/',
          'case-sensitive': true
        },
        redirect: '/folder/index.html'
      })
        .then(value => {
          assert(() => value === undefined)
          assert(() => response.statusCode === 200)
          assert(() => response.headers['Content-Type'] === htmlMimeType)
          assert(() => response.toString() === '<html />')
        })
    })

    after(() => {
      fs.setCaseSensitive(true)
    })
  })

  describe('ignore-if-not-found', function () {
    it('does not fail with 404 if the file does not exist', () => {
      const request = new Request()
      const response = new Response()
      return fileHandler.redirect({
        request,
        response,
        mapping: {
          cwd: '/',
          'ignore-if-not-found': true
        },
        redirect: './not-found'
      })
        .then(value => {
          assert(() => value === undefined)
          assert(() => response.isInitial())
        })
    })

    it('does not fail with 404 if the folder does not exist', () => {
      const request = new Request()
      const response = new Response()
      return fileHandler.redirect({
        request,
        response,
        mapping: {
          cwd: '/',
          'ignore-if-not-found': true
        },
        redirect: './not-a-folder/not-found'
      })
        .then(value => {
          assert(() => value === undefined)
          assert(() => response.isInitial())
        })
    })

    it('still fails for incorrect folder access (url must end with /)', () => {
      const request = new Request()
      const response = new Response()
      return fileHandler.redirect({
        request,
        response,
        mapping: {
          cwd: '/',
          'ignore-if-not-found': true
        },
        redirect: './folder'
      })
        .then(value => {
          assert(() => value === 404)
        })
    })

    it('does not fail with 404 if the folder does not have index.html', () => {
      const request = new Request()
      const response = new Response()
      return fileHandler.redirect({
        request,
        response,
        mapping: {
          cwd: '/',
          'ignore-if-not-found': true
        },
        redirect: './no-index/'
      })
        .then(value => {
          assert(() => value === undefined)
          assert(() => response.isInitial())
        })
    })
  })
})
