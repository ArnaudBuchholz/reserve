'use strict'

const { log } = require('../console')
const logCommon = require('./logCommon')
const logError = require('./logError')

const onRedirected = (verbose, event) => {
  const statusCode = event.statusCode
  let statusText
  if (!statusCode) {
    statusText = 'N/A'
  } else {
    statusText = statusCode.toString()
  }
  logCommon.call(event, 'SERVE', verbose, statusText, `${event.timeSpent} ms`)
}

const onIncoming = event => logCommon.call(event, 'INCMG', true, event.method, event.url)

const onEvent = (type, event) => logCommon.call(event, type, true)

const onRedirecting = event => {
  const redirect = event.redirect
  let redirectLabel
  if (typeof redirect === 'function') {
    redirectLabel = redirect.name || 'anonymous'
  } else {
    redirectLabel = redirect.toString()
  }
  logCommon.call(event, 'RDRCT', true, event.type, redirectLabel)
}

module.exports = (serve, verbose) => {
  serve
    .on('ready', ({ url }) => {
      log(`Server running at ${url}`)
    })
    .on('redirected', onRedirected.bind(null, verbose))
  if (verbose) {
    serve
      .on('error', event => { logError(event, true) })
      .on('incoming', onIncoming)
      .on('aborted', onEvent.bind(null, 'ABORT'))
      .on('closed', onEvent.bind(null, 'CLOSE'))
      .on('redirecting', onRedirecting)
  } else {
    serve
      .on('error', logError)
  }
  return serve
}
