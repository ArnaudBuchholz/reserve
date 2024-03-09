'use strict'

const { pipeline, zlib } = require('../node-api')
const defer = require('./defer')
const { throwError, newError, ERROR_CAPTURE_UNSUPPORTED_ENCODING, ERROR_CAPTURE_INVALID_STATUS } = require('../error')

const decoderFactories = {
  gzip: zlib.createGunzip,
  deflate: zlib.createInflate,
  br: zlib.createBrotliDecompress,
  default: encoding => { throwError(ERROR_CAPTURE_UNSUPPORTED_ENCODING, { encoding }) }
}

function selectDecoder (headers) {
  const encoding = headers['content-encoding']
  if (encoding && encoding !== 'identity') {
    const factory = decoderFactories[encoding] || decoderFactories.default
    return factory(encoding)
  }
}

function _getParameters (forEnd, args) {
  let [data, encoding, callback = () => {}] = args
  if (forEnd && typeof data === 'function') {
    callback = data
    data = undefined
    encoding = undefined
  } else if (typeof encoding === 'function') {
    callback = encoding
    encoding = undefined
  }
  return { data, encoding, callback }
}

const writeParameters = _getParameters.bind(null, false)
const endParameters = _getParameters.bind(null, true)

function capture (response, headers, writableStream) {
  const [promise, done, fail] = defer()
  const { emit, end, write } = response

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

    if (out !== writableStream) {
      writableStream.on('error', onError)
      pipeline(out, writableStream, () => {
        writableStream.end()
      })
    }

    response.on('error', onError)

    writableStream.on('finish', () => done())

    let writeToOut = true

    response.write = function () {
      const { data, encoding, callback } = writeParameters(arguments)
      let waitForDrain = 0
      function drained () {
        if (--waitForDrain === 0) {
          response.emit = emit
          response.emit('drain')
        }
      }
      /* istanbul ignore else */
      if (writeToOut) {
        if (!out.write(data, encoding)) {
          ++waitForDrain
          out.once('drain', drained)
        }
      }
      if (!write.call(response, data, encoding, callback)) {
        ++waitForDrain
      }
      if (waitForDrain) {
        response.emit = function (eventName) {
          if (eventName !== 'drain') {
            return emit.apply(response, arguments)
          }
          drained()
        }
        return false
      }
      return true
    }

    response.end = function () {
      const { data, encoding, callback } = endParameters(arguments)
      if (out !== writableStream) {
        out.end(data, encoding)
      } else {
        writableStream.end(data, encoding)
      }
      writeToOut = false
      end.call(response, data, encoding, function () {
        callback.apply(this, arguments)
      })
      return this
    }
  } catch (e) {
    fail(e)
  }
  return promise
}

module.exports = (response, writableStream) => {
  const [promise, done, fail] = defer()
  const { writeHead } = response
  response.writeHead = function (status, headers = {}) {
    if (status === 200) {
      done(capture(response, headers, writableStream))
    } else {
      fail(newError(ERROR_CAPTURE_INVALID_STATUS))
    }
    writeHead.apply(response, arguments)
  }
  return promise
}
