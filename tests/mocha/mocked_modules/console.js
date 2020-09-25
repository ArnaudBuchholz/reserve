'use strict'

const { join } = require('path')
const assert = require('../assert')

const traces = []

function trace (type, ...params) {
  params.forEach(param => assert(() => typeof param === 'string'))
  traces.push({ type, text: params.join(' ') })
}

require('mock-require')(join(__dirname, '../../../console.js'), {
  log: trace.bind(null, 'log'),
  error: trace.bind(null, 'error')
})

module.exports = {
  clean: () => { traces.length = 0 },
  collect: () => traces
}
