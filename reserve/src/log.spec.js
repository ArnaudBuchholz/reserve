'use strict'

const { describe, it, before, beforeEach } = require('mocha')
const assert = require('assert')
const { console: { clean, collect } } = require('test-tools')
const { log } = require('./index')
const {
  newEventEmitter,
  EVENT_CREATED,
  EVENT_READY,
  EVENT_INCOMING,
  EVENT_ERROR,
  EVENT_REDIRECTED,
  EVENT_REDIRECTING,
  EVENT_ABORTED,
  EVENT_CLOSED
} = require('./event')

describe('log', () => {
  beforeEach(clean)

  describe('non verbose', () => {
    let emit

    before(() => {
      const { on, emit: _emit } = newEventEmitter()
      log({ on }, false)
      emit = _emit
    })

    const ignored = {
      created: EVENT_CREATED,
      incoming: EVENT_INCOMING,
      redirecting: EVENT_REDIRECTING,
      aborted: EVENT_ABORTED,
      closed: EVENT_CLOSED
    }

    Object.keys(ignored).forEach(eventName => it(`ignores '${eventName}'`, () => {
      emit(ignored[eventName])
      assert.strictEqual(collect().length, 0)
    }))

    it('logs \'ready\'', () => {
      const url = 'http://localhost:1234'
      emit(EVENT_READY, { url })
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
      emit(EVENT_REDIRECTED, request, {
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
      emit(EVENT_REDIRECTED, request, {
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
      emit(EVENT_REDIRECTED, request, {
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
      emit(EVENT_ERROR, request, {
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
    let emit

    before(() => {
      const { on, emit: _emit } = newEventEmitter()
      log({ on }, true)
      emit = _emit
    })

    it('ignores \'created\'', () => {
      emit(EVENT_CREATED)
      assert.strictEqual(collect().length, 0)
    })

    it('logs \'ready\'', () => {
      const url = 'http://localhost:1234'
      emit(EVENT_READY, { url })
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
      emit(EVENT_INCOMING, request)
      const output = collect()
      assert.strictEqual(output.length, 1)
      assert.strictEqual(output[0].type, 'log')
      assert.ok(output[0].text.includes('METHOD'))
      assert.ok(output[0].text.includes('URL'))
      assert.ok(output[0].text.includes('0D93')) // min 4 chars
    })

    it('logs \'incoming\' (longer ID)', () => {
      emit(EVENT_INCOMING, request, {
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
      emit(EVENT_REDIRECTING, request, {
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
      emit(EVENT_REDIRECTING, request, {
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
      emit(EVENT_REDIRECTING, request, {
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
      emit(EVENT_REDIRECTED, request, {
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
      emit(EVENT_ERROR, request, {
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
      emit(EVENT_ABORTED, request)
      const output = collect()
      assert.strictEqual(output.length, 1)
      assert.strictEqual(output[0].type, 'log')
      assert.ok(!output[0].text.includes('METHOD'))
      assert.ok(!output[0].text.includes('URL'))
      assert.ok(output[0].text.includes('0D93'))
    })

    it('logs \'closed\'', () => {
      emit(EVENT_CLOSED, request)
      const output = collect()
      assert.strictEqual(output.length, 1)
      assert.strictEqual(output[0].type, 'log')
      assert.ok(!output[0].text.includes('METHOD'))
      assert.ok(!output[0].text.includes('URL'))
      assert.ok(output[0].text.includes('0D93'))
    })
  })
})
