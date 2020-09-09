'use strict'

const assert = require('../assert')
const mime = require('../../../detect/mime')
const fileHandler = require('../../../handlers/file')
const handle = require('./handle')(fileHandler, { mapping: { cwd: '/' } })
const fs = require('fs')

const textMimeType = mime.getType('text')
const htmlMimeType = mime.getType('html')
const defaultMimeType = mime.getType('bin')

describe('handlers/file', () => {
  it('returns a promise', async () => {
    const { promise } = await handle('./file.txt')
    assert(() => typeof promise.then === 'function')
  })

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
})
