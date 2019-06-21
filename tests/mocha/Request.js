'use strict'

const { Readable } = require('stream')

module.exports = class Request extends Readable {
  _read () {
    if (this._readCompleted) {
      return null
    }
    this._readCompleted = true
    return this._body
  }

  constructor (method = 'GET', url = '/', headers = {}, body = '') {
    super()
    this._method = method
    this._url = url
    this._headers = headers
    this._body = body
    this._readCompleted = false
  }

  get method () {
    return this._method
  }

  get url () {
    return this._url
  }

  get headers () {
    return this._headers
  }
}
