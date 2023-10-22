'use strict'

const logCommon = require('./logCommon')

module.exports = (event, verbose = false) => {
  const reason = event.reason
  if (event.method && event.url) {
    const details = []
    if (verbose) {
      details.push(reason.toString())
    } else {
      details.push('\n\\____', reason.toString())
    }
    logCommon.call(event, 'ERROR', verbose, ...details)
  } else {
    logCommon.call({ ...event, method: '', url: '' }, 'ERROR', false, reason.toString())
  }
}
