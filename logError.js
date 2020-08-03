'use strict'

const { gray, red } = require('./detect/colors')
const logCommon = require('./logCommon')

module.exports = event => {
  const reason = event.reason
  if (event.method && event.url) {
    logCommon.call(event, 'ERROR', false, red('\n\\____'), gray(reason.toString()))
  } else {
    logCommon.call({ ...event, method: '', url: '' }, 'ERROR', false, gray(reason.toString()))
  }
}
