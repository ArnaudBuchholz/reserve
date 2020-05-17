'use strict'

const assert = require('./assert')
const capture = require('../../capture')
const Response = require('../../mock/Response')
const { readFile } = require('fs')
const zlib = require('zlib')
const { pipeline } = require('stream')

const readFileAsync = require('util').promisify(readFile)

function setup () {
  const response = new Response()
  const writableStream = new Response()
  const promise = capture(response, writableStream)
  return { response, writableStream, promise }
}

describe('capture', () => {
  let loremIpsum

  before(async () => {
    loremIpsum = (await readFileAsync('/lorem ipsum.txt')).toString()
  })

  const it_ = () => {}

  it_('fails if the response status is not 200', done => {
    const { response, promise } = setup()
    promise
      .then(assert.notExpected, reason => {
        assert(() => reason.message === 'Invalid status')
        return response.waitForFinish()
      })
      .then(() => {
        assert(() => response.statusCode === 500)
        assert(() => response.toString() === loremIpsum)
      })
      .then(done, done)
    response.writeHead(500)
    response.end(loremIpsum)
  })

  it_('copies response content (on write)', done => {
    const { response, writableStream, promise } = setup()
    promise
      .then(() => {
        assert(() => writableStream.toString() === loremIpsum)
        return response.waitForFinish()
      })
      .then(() => {
        assert(() => response.statusCode === 200)
        assert(() => response.toString() === loremIpsum)
      })
      .then(done, done)
    response.writeHead(200)
    response.write(loremIpsum)
    response.end()
  })

  it_('copies response content (on end)', done => {
    const { response, writableStream, promise } = setup()
    promise
      .then(() => {
        assert(() => writableStream.toString() === loremIpsum)
        return response.waitForFinish()
      })
      .then(() => {
        assert(() => response.statusCode === 200)
        assert(() => response.toString() === loremIpsum)
      })
      .then(done, done)
    response.writeHead(200)
    response.end(loremIpsum)
  })

  describe('encoding', () => {
    it_('fails on unsupported encoding', done => {
      const { response, promise } = setup()
      promise
        .then(assert.notExpected, reason => {
          assert(() => reason.message.startsWith('Unsupported encoding'))
          return response.waitForFinish()
        })
        .then(() => {
          assert(() => response.statusCode === 200)
          assert(() => response.toString() === loremIpsum)
        })
        .then(done, done)
      response.writeHead(200, {
        'content-encoding': 'unknown'
      })
      response.end(loremIpsum)
    })

    function testWithEncoding (contentEncoding, encoder, done) {
      const { response, writableStream, promise } = setup()
      promise
        .then(() => {
          assert(() => writableStream.toString() === loremIpsum)
          return response.waitForFinish()
        })
        .then(() => {
          assert(() => response.statusCode === 200)
          assert(() => response.toString() === loremIpsum)
        })
        .then(done, done)
      response.writeHead(200, {
        'content-encoding': contentEncoding
      })
      encoder.pipe(response)
      encoder.write(loremIpsum, () => {
        encoder.end()
      })
    }

    it('supports gzip', done => {
      testWithEncoding('gzip', zlib.createGzip(), done)
    })

    it('supports deflate', done => {
      testWithEncoding('deflate', zlib.createInflateRaw(), done)
    })

    if (zlib.createBrotliCompress) {
      it('supports br', done => {
        testWithEncoding('br', zlib.createBrotliCompress(), done)
      })
    }
  })
})
