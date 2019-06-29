'use strict'

const { Duplex } = require('stream')

module.exports = class Response extends Duplex {
  _read () {
    this.push(this.toString())
    this.push(null)
  }

  _write (chunk) {
    this._buffer.push(chunk.toString())
  }

  setHeader (name, value) {
    this._headers[name] = value
  }

  writeHead (statusCode, headers) {
    this._statusCode = statusCode
    this._headers = { ...this._headers, ...headers }
  }

  end (chunk) {
    if (chunk) {
      this.write(chunk)
    }
    this._finished = true
  }

  constructor () {
    super()
    this._buffer = []
    this._headers = {}
    this._finished = false
  }

  get headers () {
    return this._headers
  }

  get statusCode () {
    return this._statusCode
  }

  get finished () {
    return this._finished
  }

  toString () {
    return this._buffer.join('')
  }
}
