'use strict'

const colors = require('./detect/colors')

module.exports = ({ method, url, reason }) => {
  if (method && url) {
    console.error(colors.red('ERROR'), colors.gray(method), colors.gray(url), colors.red('\n\\____'),
      colors.gray(reason.toString()))
  } else {
    console.error(colors.red('ERROR'), colors.gray(reason.toString()))
  }
}
