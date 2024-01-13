'use strict'

const { parseArgs } = require('util')
const v8 = require('v8')

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
    },
    memory: {
      type: 'boolean',
      short: 'm',
      default: true
    },
    heap: {
      type: 'boolean',
      short: 'h',
      default: false
    },
    promises: {
      type: 'boolean',
      short: 'q',
      default: false
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
const { memory, heap, promises } = values
console.log('duration (ms)   ', ':', duration)
console.log('frequency (ms)  ', ':', frequency)
console.log('parallel        ', ':', parallel)
console.log('memory          ', ':', memory)
console.log('v8 heap         ', ':', heap)
console.log('pending promises', ':', promises)
console.log('script          ', ':', script)

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

const TICKS = ['\u280b', '\u2819', '\u2839', '\u2838', '\u283c', '\u2834', '\u2826', '\u2827', '\u2807', '\u280f']
let tick = -1
let measureTick = performance.now()
const measures = []
const endAfter = measureTick + duration
let steps = 0
let stepsCompleted = 0
let stepsKilled = 0
let pendingPromisesCount = 0

if (promises) {
  v8.promiseHooks.onInit(() => ++pendingPromisesCount)
  v8.promiseHooks.onSettled(() => --pendingPromisesCount)
}

const measure = (tick = performance.now()) => {
  const data = {
    tick,
    started: steps,
    completed: stepsCompleted
  }
  if (memory) {
    data.memory = process.memoryUsage()
  }
  if (heap) {
    data.heap = v8.getHeapStatistics()
  }
  if (promises) {
    data.promises = {
      pending: pendingPromisesCount
    }
  }
  measures.push(data)
}

const step = async () => {
  const id = ++steps
  const start = performance.now()
  await callback()
  const end = performance.now()
  ++stepsCompleted
  if (start >= measureTick) {
    measure()
    process.stdout.write(' ' + TICKS[(++tick) % TICKS.length] + ' ' + id.toString() + '\x1b[1G')
    measureTick = start + frequency
  }
  if (end < endAfter) {
    return step()
  }
  if (++stepsKilled === parallel) {
    measure()
    console.log('iterations    ', ':', steps)
    console.log(measures)
  }
}

for (let i = 0; i < parallel; ++i) {
  step()
}
