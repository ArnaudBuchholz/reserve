'use strict'

const { Duplex } = require('stream')

module.exports = class Response extends Duplex {
  _read () {
    return null
  }

  _write (chunk) {
    this._buffer.push(chunk.toString())
  }

  writeHead (statusCode, headers) {
    this._statusCode = statusCode
    this._headers = { ...this._headers, ...headers }
  }

  constructor () {
    super()
    this._buffer = []
    this._headers = {}
  }

  get headers () {
    return this._headers
  }

  get statusCode () {
    return this._statusCode
  }

  toString () {
    return this._buffer.join('')
  }
}
