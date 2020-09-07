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

function test (redirect, mapping = { cwd: '/' }, method = 'GET') {
  const request = new Request(method)
  const response = new Response()
  return fileHandler.validate(mapping)
    .then(() => {
      const promise = fileHandler.redirect({
        request,
        response,
        mapping,
        redirect
      })
      return { promise, response }
    })
}

describe('handlers/file', () => {
  it('returns a promise', async () => {
    const { promise } = await test('./file.txt')
    assert(() => typeof promise.then === 'function')
  })

  it('pipes file content (relative path)', () => test('./file.txt')
    .then(({ promise, response }) => promise.then(value => {
      assert(() => value === undefined)
      assert(() => response.statusCode === 200)
      assert(() => response.headers['Content-Type'] === textMimeType)
      assert(() => response.toString() === 'Hello World!')
    }))
  )

  it('pipes file content (absolute path)', () => test('/file.txt', {
    cwd: '/folder'
  })
    .then(({ promise, response }) => promise.then(value => {
      assert(() => value === undefined)
      assert(() => response.statusCode === 200)
      assert(() => response.headers['Content-Type'] === textMimeType)
      assert(() => response.toString() === 'Hello World!')
    }))
  )

  it('pipes file content (trim parameters)', () => test('/file.txt?param=1#hash')
    .then(({ promise, response }) => promise.then(value => {
      assert(() => value === undefined)
      assert(() => response.statusCode === 200)
      assert(() => response.headers['Content-Type'] === textMimeType)
      assert(() => response.toString() === 'Hello World!')
    }))
  )

  it('checks file access (url must *not* end with /)', () => test('./file.txt/')
    .then(({ promise, response }) => promise.then(value => {
      assert(() => value === 404)
    }))
  )

  it('checks folder access (url must end with /)', () => test('./folder')
    .then(({ promise, response }) => promise.then(value => {
      assert(() => value === 404)
    }))
  )

  it('sends index.html if accessing a folder', () => test('./folder/')
    .then(({ promise, response }) => promise.then(value => {
      assert(() => value === undefined)
      assert(() => response.statusCode === 200)
      assert(() => response.headers['Content-Type'] === htmlMimeType)
      assert(() => response.headers['Content-Length'] === 8)
      assert(() => response.toString() === '<html />')
    }))
  )

  it('sends index.html if accessing a folder (HEAD)', () => test('./folder/', undefined, 'HEAD')
    .then(({ promise, response }) => promise.then(value => {
      assert(() => value === undefined)
      assert(() => response.statusCode === 200)
      assert(() => response.headers['Content-Type'] === htmlMimeType)
      assert(() => response.headers['Content-Length'] === 8)
      assert(() => response.toString() === '')
    }))
  )

  it('defaults mimetype when no extension', () => test('./file')
    .then(({ promise, response }) => promise.then(value => {
      assert(() => value === undefined)
      assert(() => response.statusCode === 200)
      assert(() => response.headers['Content-Type'] === defaultMimeType)
      assert(() => response.toString() === 'binary')
    }))
  )

  it('fails with 404 if the file does not exist', () => test('./not-found')
    .then(({ promise }) => promise.then(value => {
      assert(() => value === 404)
    }))
  )

  it('fails with 404 if the folder does not exist', () => test('./not-a-folder/not-found')
    .then(({ promise }) => promise.then(value => {
      assert(() => value === 404)
    }))
  )

  it('fails with 404 if the folder does not have index.html', () => test('./no-index/')
    .then(({ promise }) => promise.then(value => {
      assert(() => value === 404)
    }))
  )

  describe('Case insensitive file system', function () {
    before(() => {
      fs.setCaseSensitive(false)
    })

    it('finds the file even if the file name does not match case sensitively', () => test('/File.txt')
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === undefined)
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.headers['Content-Length'] === 12)
        assert(() => response.toString() === 'Hello World!')
      }))
    )

    it('finds the file even if the file name does not match case sensitively (HEAD)', () => test('/File.txt', undefined, 'HEAD')
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === undefined)
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.headers['Content-Length'] === 12)
        assert(() => response.toString() === '')
      }))
    )

    it('fails with 404 if the file name does not match case sensitively but case-sensitive is set', () => test('/File.txt', {
      cwd: '/',
      'case-sensitive': true
    })
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === 404)
      }))
    )

    it('finds the file case sensitively when requested', () => test('/file.txt', {
      cwd: '/',
      'case-sensitive': true
    })
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === undefined)
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.headers['Content-Length'] === 12)
        assert(() => response.toString() === 'Hello World!')
      }))
    )

    it('finds the file case sensitively when requested (HEAD)', () => test('/file.txt', {
      cwd: '/',
      'case-sensitive': true
    }, 'HEAD')
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === undefined)
        assert(() => response.statusCode === 200)
        assert(() => response.headers['Content-Type'] === textMimeType)
        assert(() => response.headers['Content-Length'] === 12)
        assert(() => response.toString() === '')
      }))
    )

    it('fails with 404 if the file name does not match case sensitively but case-sensitive is set (folder)', () => test('/Folder/index.html', {
      cwd: '/',
      'case-sensitive': true
    })
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === 404)
      }))
    )

    it('finds the file case sensitively when requested (folder)', () => test('/folder/index.html', {
      cwd: '/',
      'case-sensitive': true
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
    it('does not fail with 404 if the file does not exist', () => test('./not-found', {
      cwd: '/',
      'ignore-if-not-found': true
    })
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === undefined)
        assert(() => response.isInitial())
      }))
    )

    it('does not fail with 404 if the folder does not exist', () => test('./not-a-folder/not-found', {
      cwd: '/',
      'ignore-if-not-found': true
    })
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === undefined)
        assert(() => response.isInitial())
      }))
    )

    it('still fails for incorrect folder access (url must end with /)', () => test('./folder', {
      cwd: '/',
      'ignore-if-not-found': true
    })
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === 404)
      }))
    )

    it('does not fail with 404 if the folder does not have index.html', () => test('./no-index/', {
      cwd: '/',
      'ignore-if-not-found': true
    })
      .then(({ promise, response }) => promise.then(value => {
        assert(() => value === undefined)
        assert(() => response.isInitial())
      }))
    )
  })
})
