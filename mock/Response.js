'use strict'

const { Duplex } = require('stream')

class Response extends Duplex {
  _read () {
    this.push(this.toString())
    this.push(null)
  }

  _write (chunk, encoding, onwrite) {
    this._headersSent = true
    this._buffer.push(chunk.toString())
    onwrite()
  }

  setHeader (name, value) {
    this._headers[name] = value
  }

  writeHead (statusCode, headers) {
    this._statusCode = statusCode
    this._headers = { ...this._headers, ...headers }
  }

  flushHeaders () {
    this._headersSent = true
  }

  end () {
    this._headersSent = true
    return super.end.apply(this, arguments)
  }

  constructor () {
    super()
    this._buffer = []
    this._headers = {}
    this._headersSent = false
  }

  get headers () {
    return this._headers
  }

  get statusCode () {
    return this._statusCode
  }

  get headersSent () {
    return this._headersSent
  }

  toString () {
    return this._buffer.join('')
  }
}

Response.prototype.waitForFinish = require('../waitForFinish')

module.exports = Response
