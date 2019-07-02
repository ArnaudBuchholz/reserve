'use strict'

require('colors')

module.exports = (serve, verbose) => {
  serve
    .on('ready', ({ url }) => {
      console.log(`Server running at ${url}`.yellow)
      if (process.send) {
        process.send('ready')
      }
    })
    .on('error', ({ method, url, reason }) => {
      if (method && url) {
        console.error('ERROR'.red, method.gray, url.gray, '\n\\____'.red, reason.toString().gray)
      } else {
        console.error('ERROR'.red, reason.toString().gray)
      }
    })
    .on('redirected', ({ method, url, statusCode, timeSpent }) => {
      let report
      if (statusCode > 399) {
        report = statusCode.toString().red
      } else {
        report = statusCode.toString().green
      }
      report += ` ${timeSpent} ms`.magenta
      console.log('SERVE'.magenta, method.gray, url.gray, report)
    })

  if (verbose) {
    serve.on('redirecting', ({ method, url, type, redirect }) => {
      let redirectLabel
      if (typeof redirect === 'function') {
        redirectLabel = '(function)'
      } else {
        redirectLabel = redirect.toString()
      }
      console.log('RDRCT'.gray, method.gray, url.gray, '\n\\____'.gray, type.gray, redirectLabel.gray)
    })
  }
}
