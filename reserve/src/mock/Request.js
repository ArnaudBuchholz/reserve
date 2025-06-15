'use strict'

const { Readable, Socket } = require('../node-api')
const headersFactory = require('./headers')
const BASE = 'http://localhost'

function normalize (url) {
  const normalized = new URL(url, BASE).toString()
  if (normalized.startsWith(BASE)) {
    return normalized.substring(BASE.length)
  }
  return normalized
}

module.exports = class Request extends Readable {
  _read () {
    this.push(this._body)
    this.push(null)
  }

  _fromObject ({ method, url, headers = {}, body = '', properties }) {
    this._method = method
    this._url = normalize(url)
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

  setForgedUrl (url) {
    this._url = url
  }

  get headers () {
    return this._headers
  }

  get socket () {
    if (!this._socket) {
      this._socket = new Socket()
    }
    return this._socket
  }

  abort () {
    this.aborted = true
    this.emit('aborted')
  }
}
