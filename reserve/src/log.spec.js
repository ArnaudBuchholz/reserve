'use strict'

const assert = require('assert')
const { console: { clean, collect } } = require('test-tools')
const { log } = require('./index')
const EventEmitter = require('events')

describe('log', () => {
  beforeEach(clean)

  describe('non verbose', () => {
    let emitter

    before(() => {
      emitter = new EventEmitter()
      log(emitter, false)
    })

    const ignored = [
      'created',
      'incoming',
      'redirecting',
      'aborted',
      'closed'
    ]

    ignored.forEach(eventName => it(`ignores '${eventName}`, () => {
      emitter.emit(eventName, {})
      assert.strictEqual(collect().length, 0)
    }))

    it('logs \'ready\'', () => {
      const url = 'http://localhost:1234'
      emitter.emit('ready', { url })
      const output = collect()
      assert.strictEqual(output.length, 1)
      assert.strictEqual(output[0].type, 'log')
      assert.ok(output[0].text.includes(url))
    })

    const request = {
      method: 'METHOD',
      url: 'URL',
      start: new Date(2020, 0, 1, 0, 0, 0, 0),
      id: 3475 // hex is 0D93
    }

    it('logs \'redirected\'', () => {
      emitter.emit('redirected', {
        ...request,
        end: new Date(2020, 0, 1, 0, 0, 0, 100),
        timeSpent: 100,
        statusCode: 200
      })
      const output = collect()
      assert.strictEqual(output.length, 1)
      assert.strictEqual(output[0].type, 'log')
      assert.ok(output[0].text.includes('METHOD'))
      assert.ok(output[0].text.includes('URL'))
      assert.ok(output[0].text.includes('200'))
      assert.ok(output[0].text.includes('100'))
      assert.ok(!output[0].text.includes('3475'))
      assert.ok(!output[0].text.includes('D93'))
    })

    it('logs \'redirected\' (no status code)', () => {
      emitter.emit('redirected', {
        ...request,
        end: new Date(2020, 0, 1, 0, 0, 0, 100),
        timeSpent: 100
      })
      const output = collect()
      assert.strictEqual(output.length, 1)
      assert.strictEqual(output[0].type, 'log')
      assert.ok(output[0].text.includes('METHOD'))
      assert.ok(output[0].text.includes('URL'))
      assert.ok(output[0].text.includes('N/A'))
      assert.ok(output[0].text.includes('100'))
      assert.ok(!output[0].text.includes('3475'))
      assert.ok(!output[0].text.includes('D93'))
    })

    it('logs \'redirected\' (error status code)', () => {
      emitter.emit('redirected', {
        ...request,
        end: new Date(2020, 0, 1, 0, 0, 0, 100),
        timeSpent: 100,
        statusCode: 400
      })
      const output = collect()
      assert.strictEqual(output.length, 1)
      assert.strictEqual(output[0].type, 'log')
      assert.ok(output[0].text.includes('METHOD'))
      assert.ok(output[0].text.includes('URL'))
      assert.ok(output[0].text.includes('400'))
      assert.ok(output[0].text.includes('100'))
      assert.ok(!output[0].text.includes('3475'))
      assert.ok(!output[0].text.includes('D93'))
    })

    it('logs \'error\'', () => {
      emitter.emit('error', {
        ...request,
        reason: 'REASON'
      })
      const output = collect()
      assert.strictEqual(output.length, 1)
      assert.strictEqual(output[0].type, 'error')
      assert.ok(output[0].text.includes('URL'))
      assert.ok(output[0].text.includes('REASON'))
      assert.ok(!output[0].text.includes('3475'))
      assert.ok(!output[0].text.includes('D93'))
    })
  })

  describe('verbose', () => {
    let emitter

    before(() => {
      emitter = new EventEmitter()
      log(emitter, true)
    })

    it('ignores \'created\'', () => {
      emitter.emit('created', {})
      assert.strictEqual(collect().length, 0)
    })

    it('logs \'ready\'', () => {
      const url = 'http://localhost:1234'
      emitter.emit('ready', { url })
      const output = collect()
      assert.strictEqual(output.length, 1)
      assert.strictEqual(output[0].type, 'log')
      assert.ok(output[0].text.includes(url))
    })

    const request = {
      method: 'METHOD',
      url: 'URL',
      start: new Date(2020, 0, 1, 0, 0, 0, 0),
      id: 3475 // hex is 0D93
    }

    it('logs \'incoming\'', () => {
      emitter.emit('incoming', request)
      const output = collect()
      assert.strictEqual(output.length, 1)
      assert.strictEqual(output[0].type, 'log')
      assert.ok(output[0].text.includes('METHOD'))
      assert.ok(output[0].text.includes('URL'))
      assert.ok(output[0].text.includes('0D93')) // min 4 chars
    })

    it('logs \'incoming\' (longer ID)', () => {
      emitter.emit('incoming', {
        ...request,
        id: 34753475 // hex is 2124BC3
      })
      const output = collect()
      assert.strictEqual(output.length, 1)
      assert.strictEqual(output[0].type, 'log')
      assert.ok(output[0].text.includes('METHOD'))
      assert.ok(output[0].text.includes('URL'))
      assert.ok(output[0].text.includes('2124BC3'))
    })

    it('logs \'redirecting\'', () => {
      emitter.emit('redirecting', {
        ...request,
        type: 'HANDLER',
        redirect: 'REDIRECT'
      })
      const output = collect()
      assert.strictEqual(output.length, 1)
      assert.strictEqual(output[0].type, 'log')
      assert.ok(!output[0].text.includes('METHOD'))
      assert.ok(!output[0].text.includes('URL'))
      assert.ok(output[0].text.includes('0D93'))
      assert.ok(output[0].text.includes('HANDLER'))
      assert.ok(output[0].text.includes('REDIRECT'))
    })

    /* istanbul ignore next */ // Won't be triggered
    function REDIRECT () {}

    it('logs \'redirecting\' (redirect function)', () => {
      emitter.emit('redirecting', {
        ...request,
        type: 'HANDLER',
        redirect: REDIRECT
      })
      const output = collect()
      assert.strictEqual(output.length, 1)
      assert.strictEqual(output[0].type, 'log')
      assert.ok(!output[0].text.includes('METHOD'))
      assert.ok(!output[0].text.includes('URL'))
      assert.ok(output[0].text.includes('0D93'))
      assert.ok(output[0].text.includes('HANDLER'))
      assert.ok(output[0].text.includes('REDIRECT'))
    })

    /* istanbul ignore next */ // Won't be triggered
    const unnamed = (function () { return () => {} }())

    it('logs \'redirecting\' (redirect anonymous function)', () => {
      emitter.emit('redirecting', {
        ...request,
        type: 'HANDLER',
        redirect: unnamed
      })
      const output = collect()
      assert.strictEqual(output.length, 1)
      assert.strictEqual(output[0].type, 'log')
      assert.ok(!output[0].text.includes('METHOD'))
      assert.ok(!output[0].text.includes('URL'))
      assert.ok(output[0].text.includes('0D93'))
      assert.ok(output[0].text.includes('HANDLER'))
      assert.ok(output[0].text.includes('anonymous'))
    })

    it('logs \'redirected\'', () => {
      emitter.emit('redirected', {
        ...request,
        end: new Date(2020, 0, 1, 0, 0, 0, 100),
        timeSpent: 100,
        statusCode: 200
      })
      const output = collect()
      assert.strictEqual(output.length, 1)
      assert.strictEqual(output[0].type, 'log')
      assert.ok(!output[0].text.includes('METHOD'))
      assert.ok(!output[0].text.includes('URL'))
      assert.ok(output[0].text.includes('0D93'))
      assert.ok(output[0].text.includes('200'))
      assert.ok(output[0].text.includes('100'))
    })

    it('logs \'error\'', () => {
      emitter.emit('error', {
        ...request,
        reason: 'REASON'
      })
      const output = collect()
      assert.strictEqual(output.length, 1)
      assert.strictEqual(output[0].type, 'error')
      assert.ok(!output[0].text.includes('METHOD'))
      assert.ok(!output[0].text.includes('URL'))
      assert.ok(output[0].text.includes('0D93'))
      assert.ok(output[0].text.includes('REASON'))
    })

    it('logs \'aborted\'', () => {
      emitter.emit('aborted', request)
      const output = collect()
      assert.strictEqual(output.length, 1)
      assert.strictEqual(output[0].type, 'log')
      assert.ok(!output[0].text.includes('METHOD'))
      assert.ok(!output[0].text.includes('URL'))
      assert.ok(output[0].text.includes('0D93'))
    })

    it('logs \'closed\'', () => {
      emitter.emit('closed', request)
      const output = collect()
      assert.strictEqual(output.length, 1)
      assert.strictEqual(output[0].type, 'log')
      assert.ok(!output[0].text.includes('METHOD'))
      assert.ok(!output[0].text.includes('URL'))
      assert.ok(output[0].text.includes('0D93'))
    })
  })
})
