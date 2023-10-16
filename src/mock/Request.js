'use strict'

const { Readable } = require('../node-api')
const headersFactory = require('./headers')

module.exports = class Request extends Readable {
  _read () {
    this.push(this._body)
    this.push(null)
  }

  _fromObject ({ method, url, headers = {}, body = '', properties }) {
    this._method = method
    this._url = url
    this._headers = headersFactory(headers)
    this._body = body
    if (properties) {
      Object.assign(this, properties)
    }
  }

  _fromParams (method, url, headers, body, properties) {
    if (typeof body === 'object') {
      properties = body
      body = ''
    }
    if (typeof headers === 'string') {
      body = headers
      headers = {}
    }
    return this._fromObject({ method, url, headers, body, properties })
  }

  constructor (param) {
    super()
    if (typeof param === 'object') {
      this._fromObject(param)
    } else {
      this._fromParams(...arguments)
    }
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

  abort () {
    this.aborted = true
    this.emit('aborted')
  }
}
