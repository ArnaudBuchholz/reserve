'use strict'

const assert = require('../assert')
const mime = require('mime')
const Request = require('../Request')
const Response = require('../Response')
const fileHandler = require('../../../handlers/file')

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

  it('sends index.html if accessing a folder', () => {
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

  it('fails with 403 if the folder does not have index.html', () => {
    const request = new Request()
    const response = new Response()
    return fileHandler.redirect({
      request,
      response,
      mapping: {
        cwd: '/'
      },
      redirect: './no-index'
    })
      .then(value => {
        assert(() => value === 403)
      })
  })

  const methods = ['POST', 'PUT', 'DELETE']
  methods.forEach(method => it(`fails with 405 for ${method}`, () => {
    const request = new Request(method)
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
        assert(() => value === 405)
      })
  }))
})
