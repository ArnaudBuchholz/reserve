'use strict'

// const { writeFileSync } = require('fs')
const { join } = require('path')
const zlib = require('zlib')
const stream = require('stream')
const util = require('util')
const pipeline = util.promisify(stream.pipeline)

const mimeTypes = require(join(__dirname, '../src/mime.json'))

const compress = zlib.createBrotliCompress()

class Output extends stream.Writable {
  _write (chunk, encoding, onwrite) {
    this._buffers.push(chunk)
    this._length += chunk.length
    onwrite()
  }

  constructor () {
    super()
    this._length = 0
    this._buffers = []
  }

  get length () {
    return this._length
  }

  toString () {
    return Buffer.concat(this._buffers).toString('base64')
  }
}
const output = new Output()

function * genMimeTypes () {
  let lastMime
  for (const type in mimeTypes) {
    const mime = mimeTypes[type]
    if (mime !== lastMime) {
      lastMime = mime
      yield `${type} ${mime}\n`
    } else {
      yield `${type}\n`
    }
  }
}

const input = stream.Readable.from(genMimeTypes())

pipeline(input, compress, output)
  .then(() => {
    console.log('done.')
    console.log(output.length, output.toString())
  })
