'use strict'

const { gray, red } = require('./detect/colors')
const logCommon = require('./logCommon')

module.exports = (event, verbose = false) => {
  const reason = event.reason
  if (event.method && event.url) {
    const details = []
    if (verbose) {
      details.push(red(reason.toString()))
    } else {
      details.push(red('\n\\____'), gray(reason.toString()))
    }
    logCommon.call(event, 'ERROR', verbose, ...details)
  } else {
    logCommon.call({ ...event, method: '', url: '' }, 'ERROR', false, gray(reason.toString()))
  }
}
