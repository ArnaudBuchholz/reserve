'use strict'

const { Duplex } = require('../node-api')
const headersFactory = require('./headers')
const defer = require('../helpers/defer')

module.exports = class Response extends Duplex {
  _read () {
    this.push(this.toString())
    this.push(null)
  }

  _write (chunk, encoding, onwrite) {
    this._headersSent = true
    this._buffer.push(chunk.toString())
    if (this._asynchronous) {
      setTimeout(onwrite, 0)
    } else {
      onwrite()
    }
  }

  getHeader (name) {
    return this._headers[name] || ''
  }

  setHeader (name, value) {
    this._headers[name] = value
  }

  writeHead (statusCode, headers = {}) {
    this._statusCode = statusCode
    Object.keys(headers).forEach(header => {
      this._headers[header] = headers[header]
    })
  }

  flushHeaders () {
    this._headersSent = true
  }

  end () {
    this._headersSent = true
    this._ended = true
    return super.end.apply(this, arguments)
  }

  constructor (options) {
    super(options)
    this._buffer = []
    this._headers = headersFactory()
    this._headersSent = false
    const [waitForFinish, finished] = defer()
    this._waitForFinish = waitForFinish
    this.on('finish', () => finished(this))
    this._statusCode = 200
    this._ended = false
  }

  get headers () {
    return this._headers
  }

  get statusCode () {
    return this._statusCode
  }

  set statusCode (value) {
    this._statusCode = value
  }

  get headersSent () {
    return this._headersSent
  }

  get writableEnded () {
    return this._ended
  }

  toString () {
    return this._buffer.join('')
  }

  waitForFinish () {
    return this._waitForFinish
  }

  isInitial () {
    return this._buffer.length === 0 &&
      !this._headersSent &&
      Object.keys(this._headers).length === 0
  }

  setAsynchronous () {
    this._asynchronous = true
  }
}
