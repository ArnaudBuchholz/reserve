'use strict'

const colors = require('./detect/colors')
const logError = require('./logError')

const onRedirected = ({ method, url, statusCode, timeSpent }) => {
  let report
  if (!statusCode) {
    report = colors.red('N/A')
  } else if (statusCode > 399) {
    report = colors.red(statusCode.toString())
  } else {
    report = colors.green(statusCode.toString())
  }
  report += colors.magenta(` ${timeSpent} ms`)
  console.log(colors.magenta('SERVE'), colors.gray(method), colors.gray(url), report)
}

const onRedirecting = ({ method, url, type, redirect }) => {
  let redirectLabel
  if (typeof redirect === 'function') {
    redirectLabel = '(function)'
  } else {
    redirectLabel = redirect.toString()
  }
  console.log(colors.gray('RDRCT'), colors.gray(method), colors.gray(url), colors.gray('\n\\____'), colors.gray(type),
    colors.gray(redirectLabel))
}

module.exports = (serve, verbose) => {
  serve
    .on('ready', ({ url }) => {
      console.log(colors.yellow(`Server running at ${url}`))
    })
    .on('error', logError)
    .on('redirected', onRedirected)
  if (verbose) {
    serve.on('redirecting', onRedirecting)
  }
  return serve
}
