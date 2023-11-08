'use strict'

const assert = require('assert')
const capture = require('./capture')
const Response = require('./mock/Response')
const { readFile } = require('fs')
const zlib = require('zlib')

const readFileAsync = require('util').promisify(readFile)

function allocateResponse (isAsynchronous) {
  const response = new Response({
    highWaterMark: isAsynchronous ? 255 : undefined
  })
  if (isAsynchronous) {
    response.setAsynchronous()
  }
  return response
}

function setup ({ isResponseAsynchronous, isWritableStreamAsynchronous } = { isResponseAsynchronous: false, isWritableStreamAsynchronous: false }) {
  const response = allocateResponse(isResponseAsynchronous)
  const writableStream = allocateResponse(isWritableStreamAsynchronous)
  const promise = capture(response, writableStream)
  return { response, writableStream, promise }
}

function write (stream, content, steps, useEnd) {
  let offset = 0
  const size = Math.floor(content.length / steps)
  function end () {
    if (useEnd) {
      stream.end(content.substring(offset))
    } else {
      stream.write(content.substring(offset), () => {
        stream.end()
      })
    }
  }
  function loop () {
    if (steps === 1) {
      end()
    } else {
      const noWait = stream.write(content.substring(offset, offset + size), () => {
        if (!noWait) {
          loop()
        }
      })
      offset += size
      --steps
      if (noWait) {
        loop()
      }
    }
  }
  loop()
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
        assert.strictEqual(reason.message, 'Invalid status')
        return response.waitForFinish()
      })
      .then(() => {
        assert.strictEqual(response.statusCode, 500)
        assert.strictEqual(response.toString(), loremIpsum)
      })
      .then(done, done)
    response.writeHead(500)
    response.write(loremIpsum)
    response.end()
  })

  it('fails if the capturing stream fails', done => {
    const { response, writableStream, promise, steps = 5 } = setup()
    let numberOfWrites = 0
    writableStream._write = (chunk, encoding, onwrite) => {
      ++numberOfWrites
      onwrite(new Error('Simulated error'))
    }
    promise
      .then(assert.notExpected, reason => {
        assert.strictEqual(reason.message, 'Simulated error')
        assert.strictEqual(numberOfWrites, 1)
        return response.waitForFinish()
      })
      .then(() => {
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.toString(), loremIpsum)
      })
      .then(done, done)
    response.writeHead(200)
    write(response, loremIpsum, steps, false)
  })

  it('works transparently with streams (callbacks)', done => {
    const { response, writableStream, promise } = setup()
    let onEnd
    const reachedEnd = new Promise(resolve => {
      onEnd = resolve
    })
    promise
      .then(() => {
        assert.strictEqual(writableStream.toString(), loremIpsum)
        return Promise.all([response.waitForFinish(), reachedEnd])
      })
      .then(() => {
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.toString(), loremIpsum)
      })
      .then(done, done)
    response.writeHead(200, {
      'content-encoding': 'identity'
    })
    response.write(loremIpsum, () => response.end(onEnd))
  })

  function checkWriteAndEnd (label, testSetup = setup) {
    it(`${label} (on write)`, done => {
      const { response, writableStream, promise, steps = 5 } = testSetup()
      promise
        .then(() => {
          assert.strictEqual(writableStream.toString(), loremIpsum)
          return response.waitForFinish()
        })
        .then(() => {
          assert.strictEqual(response.statusCode, 200)
          assert.strictEqual(response.toString(), loremIpsum)
        })
        .then(done, done)
      response.writeHead(200)
      write(response, loremIpsum, steps, false)
    })

    it(`${label} (on end)`, done => {
      const { response, writableStream, promise, steps = 5 } = testSetup()
      promise
        .then(() => {
          assert.strictEqual(writableStream.toString(), loremIpsum)
          return response.waitForFinish()
        })
        .then(() => {
          assert.strictEqual(response.statusCode, 200)
          assert.strictEqual(response.toString(), loremIpsum)
        })
        .then(done, done)
      response.writeHead(200)
      write(response, loremIpsum, steps, true)
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
          assert.ok(reason.message.startsWith('Unsupported encoding'))
          return response.waitForFinish()
        })
        .then(() => {
          assert.strictEqual(response.statusCode, 200)
          assert.strictEqual(response.toString(), loremIpsum)
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
            assert.strictEqual(writableStream.toString(), loremIpsum)
            return response.waitForFinish()
          })
          .then(() => {
            assert.strictEqual(response.statusCode, 200)
            assert.notStrictEqual(response.toString(), loremIpsum) // because encoded
          })
          .then(done, done)
        response.writeHead(200, {
          'content-encoding': contentEncoding
        })
        encoder.pipe(response)
        write(encoder, loremIpsum, 5, false)
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
      const { response, writableStream, promise } = setup({
        isWritableStreamAsynchronous: true
      })
      return { response, writableStream, promise, steps: 5 }
    })

    checkWriteAndEnd('waits for response', () => {
      const { response, writableStream, promise } = setup({
        isResponseAsynchronous: true
      })
      return { response, writableStream, promise, steps: 5 }
    })

    checkWriteAndEnd('waits for both', () => {
      const { response, writableStream, promise } = setup({
        isWritableStreamAsynchronous: true,
        isResponseAsynchronous: true
      })
      return { response, writableStream, promise, steps: 5 }
    })
  })
})
