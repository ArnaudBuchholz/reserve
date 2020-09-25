'use strict'

const { gray, green, magenta, red, yellow } = require('./detect/colors')
const { log } = require('./console')
const logCommon = require('./logCommon')
const logError = require('./logError')

const onRedirected = (verbose, event) => {
  const statusCode = event.statusCode
  let statusText
  if (!statusCode) {
    statusText = red('N/A')
  } else if (statusCode > 399) {
    statusText = red(statusCode.toString())
  } else {
    statusText = green(statusCode.toString())
  }
  logCommon.call(event, 'SERVE', verbose, statusText, magenta(`${event.timeSpent} ms`))
}

const onIncoming = event => logCommon.call(event, 'INCMG', true, gray(event.method), gray(event.url))

const onEvent = (type, event) => logCommon.call(event, type, true)

const onRedirecting = event => {
  const redirect = event.redirect
  let redirectLabel
  if (typeof redirect === 'function') {
    redirectLabel = redirect.name || 'anonymous'
  } else {
    redirectLabel = redirect.toString()
  }
  logCommon.call(event, 'RDRCT', true, gray(event.type), gray(redirectLabel))
}

module.exports = (serve, verbose) => {
  serve
    .on('ready', ({ url }) => {
      log(yellow(`Server running at ${url}`))
    })
    .on('error', logError)
    .on('redirected', onRedirected.bind(null, verbose))
  if (verbose) {
    serve.on('incoming', onIncoming)
    serve.on('aborted', onEvent.bind(null, 'ABORT'))
    serve.on('closed', onEvent.bind(null, 'CLOSE'))
    serve.on('redirecting', onRedirecting)
  }
  return serve
}
