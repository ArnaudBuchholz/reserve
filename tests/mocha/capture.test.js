'use strict'

const assert = require('./assert')
const capture = require('../../capture')
const Response = require('../../mock/Response')
const { readFile } = require('fs')
const zlib = require('zlib')

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

  it('fails if the response status is not 200', done => {
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

  function checkWriteAndEnd (label, testSetup = setup) {
    it(`${label} (on write)`, done => {
      const { response, writableStream, promise } = testSetup()
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
  
    it(`${label} (on end)`, done => {
      const { response, writableStream, promise } = testSetup()
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
  }

  describe('synchronous streams', () => {
    checkWriteAndEnd('copies content to writable stream')
  })

  describe('encoding', () => {
    it('fails on unsupported encoding', done => {
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

    function testWithEncoding (contentEncoding, encoder) {
      it(`supports ${contentEncoding}`, done => {
        const { response, writableStream, promise } = setup()
        promise
          .then(() => {
            assert(() => writableStream.toString() === loremIpsum)
            return response.waitForFinish()
          })
          .then(() => {
            assert(() => response.statusCode === 200)
            assert(() => response.toString() !== loremIpsum) // because encoded
          })
          .then(done, done)
        response.writeHead(200, {
          'content-encoding': contentEncoding
        })
        encoder.pipe(response)
        encoder.write(loremIpsum, () => {
          encoder.end()
        })
      })
    }

    testWithEncoding('gzip', zlib.createGzip())
    testWithEncoding('deflate', zlib.createDeflate())
    /* istanbul ignore else */
    if (zlib.createBrotliCompress) {
      testWithEncoding('br', zlib.createBrotliCompress())
    }
  })

  describe('Asynchronous streams', () => {
    checkWriteAndEnd('waits for writable stream', () => {
      const { response, writableStream, promise } = setup()
      writableStream.setAsynchronous()
      return { response, writableStream, promise }
    })
  })
})
