'use strict'

const zlib = require('zlib')
const { pipeline } = require('stream')

const decoderFactories = {
  gzip: zlib.createGunzip,
  deflate: zlib.createDeflate,
  br: zlib.createBrotliDecompress,
  default: encoding => { throw new Error(`Unsupported encoding: ${encoding}`) }
}

function defer () {
  let done
  let fail
  const promise = new Promise((resolve, reject) => {
    done = resolve
    fail = reject
  })
  return { done, fail, promise }
}

function selectDecoder (headers) {
  const encoding = headers['content-encoding']
  if (encoding) {
    const factory = decoderFactories[encoding] || decoderFactories.default
    return factory(encoding)
  }
}

function capture (response, headers, writableStream) {
  const { done, fail, promise } = defer()
  const { end, write } = response

  function release () {
    response.write = write
    response.end = end
  }

  function onError (error) {
    fail(error)
    release()
  }

  try {
    const out = selectDecoder(headers) || writableStream

    out.on('error', onError)
    if (writableStream !== out) {
      writableStream.on('error', onError)
    }
    response.on('error', onError)

    const { close } = out
    out.close = function () {
      if (out !== writableStream) {
        writableStream.close()
      }
      close.apply(out, arguments)
      done()
    }

    let pendingDrain = false

    response.write = function (data, encoding, callback) {
      let flushCount = 0
      function flush () {
        if (--flushCount === 0) {
          response.emit('drain')
          pendingDrain = false
        }
      }
      function needDrain (writeResult) {
        if (!writeResult) {
          pendingDrain = true
          ++flushCount
        }
      }
      needDrain(out.write(data, encoding, flush))
      needDrain(write.call(response, data, encoding, function () {
        if (callback) {
          callback.apply(this, arguments)
        }
        flush()
      }))
      return flushCount === 0
    }

    response.end = function (data, encoding, callback) {
      function doEnd () {
        if (out !== writableStream) {
          pipeline(out, writableStream, () => {
            out.close()
          })
        } else {
          out.close()
        }
        end.apply(response, arguments)
      }
      if (pendingDrain) {
        response.on('drain', doEnd)
      } else {
        doEnd()
      }
      return this
    }
  } catch (e) {
    fail(e)
  }
  return promise
}

module.exports = (response, writableStream) => {
  const { done, fail, promise } = defer()
  const { writeHead } = response
  response.writeHead = function (status, headers) {
    if (status === 200) {
      done(capture(response, headers, writableStream))
    } else {
      fail(new Error('Invalid status'))
    }
    writeHead.apply(response, arguments)
  }
  return promise
}
