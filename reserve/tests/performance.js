'use strict'

const { parseArgs } = require('util')

const {
  values,
  positionals: { 0: script }
} = parseArgs({
  args: process.argv.slice(2),
  options: {
    duration: {
      type: 'string',
      short: 'd',
      default: '10s'
    },
    frequency: {
      type: 'string',
      short: 'f',
      default: '1000ms'
    },
    parallel: {
      type: 'string',
      short: 'p',
      default: '1'
    }
  },
  allowPositionals: true
})

const parseDelay = value => {
  const base = parseInt(value, 10)
  if (value.endsWith('ms')) {
    return base
  }
  if (value.endsWith('s')) {
    return base * 1000
  }
  return base
}

const duration = parseDelay(values.duration)
const frequency = parseDelay(values.frequency)
const parallel = parseInt(values.parallel, 10)
console.log('duration (ms) ', ':', duration)
console.log('frequency (ms)', ':', frequency)
console.log('parallel      ', ':', parallel)
console.log('script        ', ':', script)

let callback
try {
  callback = require(script)
} catch (e) {
  console.error(e.message)
  process.exit(-1)
}
callback = require(script)
if (typeof callback !== 'function') {
  console.error('Script must be a function exported with CommonJS')
  process.exit(-2)
}

const endAfter = performance.now() + duration
let count = 0

const task = async () => {
  const id = ++count
  const start = performance.now()
  await callback()
  const end = performance.now()
  const ts = end - start
  console.log(id, ts)
  if (end < endAfter) {
    return task()
  }
}

for (let i = 0; i < parallel; ++i) {
  task()
}
