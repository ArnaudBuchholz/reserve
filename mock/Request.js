'use strict'

const { Readable } = require('stream')

module.exports = class Request extends Readable {
  _read () {
    this.push(this._body)
    this.push(null)
  }

  constructor (method = 'GET', url = '/', headers = {}, body = '') {
    super()
    this._method = method
    this._url = url
    this._headers = headers
    this._body = body
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
