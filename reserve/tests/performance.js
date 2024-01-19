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
      fileData: {
        type: 'boolean',
        short: 'f',
        default: false
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
  const { fileData, measureMemory, measureV8Heap, measurePromises } = values
  console.log('duration (ms)    ', ':', duration)
  console.log('parallel         ', ':', parallel)
  console.log('start delay (ms) ', ':', startDelay)
  console.log('script           ', ':', script)
  if (scriptArgs.length) {
    console.log('script arguments ', ':', JSON.stringify(scriptArgs))
  }
  const yesNo = value => value ? '✅' : '❌'
  console.log('Measurements     ', ':', yesNo(measureInterval))
  if (measureInterval !== 0) {
    console.log('• interval (ms)  ', ':', measureInterval)
    console.log('• memory         ', ':', yesNo(measureMemory))
    console.log('• v8 heap        ', ':', yesNo(measureV8Heap))
    console.log('• promises       ', ':', yesNo(measurePromises))
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
  const endAfter = startedAt + duration
  const measures = []
  let nextTick = startedAt
  let tasksStarted = 0
  let tasksCompleted = 0
  let totalTimeSpent = 0
  let timeSpentSinceLastTick = 0
  let tasksCompletedSinceLastTick = 0
  let activeTasks = 0
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
  process.on('uncaughtException', error => {
    console.log(error)
    interrupted()
  })
  process.on('unhandledRejection', reason => {
    console.log(reason)
    interrupted()
  })

  if (promises) {
    v8.promiseHooks.onInit(() => ++promises.init)
    v8.promiseHooks.onSettled(() => ++promises.settled)
  }

  const measure = (tick = performance.now()) => {
    const data = {
      tick: Math.ceil(tick),
      started: tasksStarted,
      totalCompleted: tasksCompleted,
      totalTimeSpent,
      tickCompleted: tasksCompletedSinceLastTick,
      tickTimeSpent: timeSpentSinceLastTick
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
    measures.push(data)
    if (fileData) {
      writeFileSync(jsonl, JSON.stringify(data) + '\n', { flag: 'a' })
    }
  }

  const report = () => {
    if (measureInterval) {
      measure()
    }
    clearInterval(progress)
    console.log('📜 report')
    console.log('• completed      ', ':', tasksCompleted)
    if (measureInterval) {
      console.log('• measures       ', ':', measures.length)
      if (fileData) {
        console.log('• path           ', ':', jsonl)
      }

      const avgTimeSpent = []
      const heapUseds = []
      const avgSettledPromises = []
      measures.forEach(data => {
        const { totalCompleted: completed, tickCompleted, tickTimeSpent } = data
        if (completed > 1) {
          avgTimeSpent.push(tickTimeSpent / tickCompleted)
        }
        if (measureMemory) {
          const { memory: { heapUsed } } = data
          heapUseds.push(heapUsed)
        }
        if (measurePromises) {
          const { promises: { settled } } = data
          if (completed > 1) {
            avgSettledPromises.push(settled / completed)
          }
        }
      })

      const round = (value, decimalDigits = 1) => {
        const factor = 10 ** decimalDigits
        const roundedValue = Math.floor(factor * value) / factor
        return roundedValue.toFixed(decimalDigits)
      }
      const sum = (total, value) => total + value
      const Stats = {
        mean: values => values.reduce(sum) / values.length,
        stdDev: (values, mean = Stats.mean(values)) => {
          const variances = values.map(value => (value - mean) ** 2)
          return Math.sqrt(variances.reduce(sum) / (variances.length - 1))
        }
      }

      const averageAndStdDev = (values, decimalDigits = 2, trim = undefined) => {
        let mean
        let stdDev
        if (trim) {
          const sortedValues = values.sort()
          const skip = Math.floor(values.length * trim)
          const trimValues = sortedValues.slice(skip, -skip)
          mean = Stats.mean(trimValues)
          stdDev = Stats.stdDev(trimValues, mean)
        } else {
          mean = Stats.mean(values)
          stdDev = Stats.stdDev(values, mean)
        }
        const ratio = round(100 * stdDev / mean)
        return `${round(mean, decimalDigits)} Δ± ${round(stdDev, decimalDigits)} (${ratio}%)`
      }

      const minMax = (values, decimalDigits = 2) => {
        const mean = values.reduce(sum) / values.length
        let min = Number.POSITIVE_INFINITY
        let max = 0
        values.forEach(value => {
          if (value < min) {
            min = value
          }
          if (value > max) {
            max = value
          }
        })
        return `${min} ≤ ∑/n ${round(mean, decimalDigits)} ≤ ${max}`
      }

      if (avgTimeSpent.length > 1) {
        console.log('• time spent (ms)', ':', averageAndStdDev(avgTimeSpent, 4))
        console.log('          trim 5%', ':', averageAndStdDev(avgTimeSpent, 4, 0.05))
        console.log('         trim 15%', ':', averageAndStdDev(avgTimeSpent, 4, 0.15))
        console.log('         trim 25%', ':', averageAndStdDev(avgTimeSpent, 4, 0.25))
      }
      if (measureMemory && heapUseds.length) {
        console.log('• heapUsed       ', ':', minMax(heapUseds, 0))
      }
      if (measurePromises && avgSettledPromises.length) {
        console.log('• promises       ', ':', averageAndStdDev(avgSettledPromises))
      }
    }
  }

  const task = async () => {
    const id = ++tasksStarted
    const start = performance.now()
    await callback(id)
    const end = performance.now()
    const timeSpent = end - start
    totalTimeSpent += timeSpent
    timeSpentSinceLastTick += timeSpent
    ++tasksCompleted
    ++tasksCompletedSinceLastTick
    if (measureInterval && start >= nextTick) {
      measure()
      nextTick = start + measureInterval
      timeSpentSinceLastTick = 0
      tasksCompletedSinceLastTick = 0
    }
    if (end + startDelay < endAfter) {
      setTimeout(task, startDelay)
      return
    }
    if (--activeTasks === 0) {
      report()
    }
  }

  if (measureInterval) {
    measure()
  }
  for (let i = 0; i < parallel; ++i) {
    ++activeTasks
    setTimeout(task, startDelay)
  }
}

main()
  .catch(e => {
    console.error(e.message)
    process.exit(-1)
  })