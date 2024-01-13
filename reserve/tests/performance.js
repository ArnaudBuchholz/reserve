'use strict'

const { parseArgs } = require('util')
const v8 = require('v8')
const { join } = require('path')
const { writeFileSync } = require('fs')

async function main () {
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
      measureMemory: {
        type: 'boolean',
        short: 'm',
        default: true
      },
      measureV8Heap: {
        type: 'boolean',
        short: 'h',
        default: false
      },
      measurePromises: {
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
  const { measureMemory, measureV8Heap, measurePromises } = values
  console.log('duration (ms)   ', ':', duration)
  console.log('frequency (ms)  ', ':', frequency)
  console.log('parallel        ', ':', parallel)
  console.log('measure memory  ', ':', measureMemory)
  console.log('measure v8 heap ', ':', measureV8Heap)
  console.log('measure promises', ':', measurePromises)
  console.log('script          ', ':', script)

  const setup = require(join(process.cwd(), script))
  if (typeof setup !== 'function') {
    throw new Error('Script must be a function exported with CommonJS')
  }
  const callback = await setup()
  if (typeof callback !== 'function') {
    throw new Error('Script must return a function')
  }

  const jsonl = join(process.cwd(), script + `.${new Date().toISOString().replace(/:|-|T|Z/g, '')}.jsonl`)

  const TICKS = ['\u280b', '\u2819', '\u2839', '\u2838', '\u283c', '\u2834', '\u2826', '\u2827', '\u2807', '\u280f']
  let tick = -1
  let measureTick = performance.now()
  const endAfter = measureTick + duration
  let steps = 0
  let stepsTimeSpent = 0
  let stepsCompleted = 0
  let stepsKilled = 0
  const promises = {
    init: 0,
    settled: 0
  }

  if (promises) {
    v8.promiseHooks.onInit(() => ++promises.init)
    v8.promiseHooks.onSettled(() => ++promises.settled)
  }

  const measure = (tick = performance.now()) => {
    const data = {
      tick: Math.ceil(tick),
      timeSpent: stepsTimeSpent,
      started: steps,
      completed: stepsCompleted
    }
    if (measureMemory) {
      data.memory = process.memoryUsage()
    }
    if (measureV8Heap) {
      data.v8Heap = v8.getHeapStatistics()
    }
    if (measurePromises) {
      data.promises = { ...promises }
    }
    writeFileSync(jsonl, JSON.stringify(data) + '\n', { flag: 'a' })
  }

  const step = async () => {
    const id = ++steps
    const start = performance.now()
    await callback()
    const end = performance.now()
    stepsTimeSpent += Math.ceil(end - start)
    ++stepsCompleted
    if (start >= measureTick) {
      measure()
      process.stdout.write(' ' + TICKS[(++tick) % TICKS.length] + ' ' + id.toString() + '\x1b[1G')
      measureTick = start + frequency
    }
    if (end < endAfter) {
      setImmediate(step)
      return
    }
    if (++stepsKilled === parallel) {
      measure()
      console.log('iterations    ', ':', steps)
    }
  }

  measure()
  for (let i = 0; i < parallel; ++i) {
    step()
  }
}

main()
  .catch(e => {
    console.error(e.message)
    process.exit(-1)
  })
