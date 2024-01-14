'use strict'

const { parseArgs } = require('util')
const v8 = require('v8')
const { join } = require('path')
const { writeFileSync } = require('fs')

async function main () {
  const {
    values,
    positionals: [script, ...scriptArgs]
  } = parseArgs({
    args: process.argv.slice(2),
    options: {
      duration: {
        type: 'string',
        short: 'd',
        default: '10s'
      },
      parallel: {
        type: 'string',
        short: 'p',
        default: '1'
      },
      startDelay: {
        type: 'string',
        short: 's',
        default: '0'
      },
      measureInterval: {
        type: 'string',
        short: 'i',
        default: '1000ms'
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
  const measureInterval = parseDelay(values.measureInterval)
  const startDelay = parseDelay(values.startDelay)
  const parallel = parseInt(values.parallel, 10)
  const { measureMemory, measureV8Heap, measurePromises } = values
  console.log('duration (ms)   ', ':', duration)
  console.log('parallel        ', ':', parallel)
  console.log('start delay (ms)', ':', startDelay)
  console.log('script          ', ':', script)
  if (scriptArgs.length) {
    console.log('script arguments', ':', JSON.stringify(scriptArgs))
  }
  if (measureInterval !== 0) {
    console.log('Measurements    ', ':', 'on')
    console.log(' interval (ms)  ', ':', measureInterval)
    console.log(' memory         ', ':', measureMemory)
    console.log(' v8 heap        ', ':', measureV8Heap)
    console.log(' promises       ', ':', measurePromises)
  } else {
    console.log('Measurements  ', ':', 'off')
  }

  const setup = require(join(process.cwd(), script))
  if (typeof setup !== 'function') {
    throw new Error('Script must be a function exported with CommonJS')
  }
  const callback = await setup(...scriptArgs)
  if (typeof callback !== 'function') {
    throw new Error('Script must return a function')
  }

  const jsonl = join(process.cwd(), script + `.${new Date().toISOString().replace(/:|-|T|Z/g, '')}.jsonl`)

  const TICKS = ['\u280b', '\u2819', '\u2839', '\u2838', '\u283c', '\u2834', '\u2826', '\u2827', '\u2807', '\u280f']
  const startedAt = performance.now()
  let measureTick = startedAt
  const endAfter = measureTick + duration
  let steps = 0
  let stepsTimeSpent = 0
  let stepsCompleted = 0
  let stepsKilled = 0
  const promises = {
    init: 0,
    settled: 0
  }

  let tick = -1
  const progress = setInterval(() => {
    const timeSpent = Math.floor(performance.now() - startedAt)
    process.stdout.write(TICKS[(++tick) % TICKS.length] + ' ' + timeSpent.toString() + 'ms\x1b[1G')
  }, 100)
  process.stdout.write('\x1b[?25l') // hide cursor
  const showCursor = () => process.stdout.write('\x1b[?25h') // show cursor
  process.on('beforeExit', showCursor)
  const interrupted = () => {
    showCursor()
    console.error('⚠️ Interrupted')
    process.exit()
  }
  process.on('SIGINT', interrupted)
  process.on('SIGTERM', interrupted)

  if (promises) {
    v8.promiseHooks.onInit(() => ++promises.init)
    v8.promiseHooks.onSettled(() => ++promises.settled)
  }

  const measure = (tick = performance.now()) => {
    const data = {
      tick: Math.ceil(tick),
      started: steps,
      completed: stepsCompleted,
      timeSpent: stepsTimeSpent,
      average: stepsCompleted > 1 ? Math.ceil(100 * stepsTimeSpent / stepsCompleted) / 100 : undefined
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
    await callback(id)
    const end = performance.now()
    stepsTimeSpent += Math.ceil(end - start)
    ++stepsCompleted
    if (measureInterval && start >= measureTick) {
      measure()
      measureTick = start + measureInterval
    }
    if (end + startDelay < endAfter) {
      setTimeout(step, startDelay)
      return
    }
    if (++stepsKilled === parallel) {
      if (measureInterval) {
        measure()
      }
      clearInterval(progress)
      console.log('iterations    ', ':', steps)
    }
  }

  if (measureInterval) {
    measure()
  }
  for (let i = 0; i < parallel; ++i) {
    step()
  }
}

main()
  .catch(e => {
    console.error(e.message)
    process.exit(-1)
  })
