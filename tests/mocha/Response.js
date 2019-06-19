'use strict'

const Writable = require('stream').Writable

module.exports = class Response extends Writable {
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
