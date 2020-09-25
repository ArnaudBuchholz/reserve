'use strict'

const assert = require('./assert')
const { clean, collect } = require('./mocked_modules/console')
const { log } = require('../../index')
const EventEmitter = require('events')

describe('log', () => {
  beforeEach(clean)

  it('handle ready', () => {
    const emitter = new EventEmitter()
    log(emitter, false)
    const url = 'http://localhost:1234'
    emitter.emit('ready', { url })
    const output = collect()
    assert(() => output.length === 1)
    assert(() => output[0].type === 'log')
    assert(() => output[0].text.includes(url))
  })

  it('handle error', () => {
    const emitter = new EventEmitter()
    log(emitter, false)
    const error = {
    }
    emitter.emit('error', error)
    const output = collect()
    assert(() => output.length === 1)
    assert(() => output[0].type === 'error')
  })
})