'use strict'

const Readable = require('stream').Readable

module.exports = class Request extends Readable {
  constructor (method = 'GET', url = '/') {
    super()
    this._method = method
    this._url = url
  }

  get method () {
    return this._method
  }

  get url () {
    return this._url
  }
}
