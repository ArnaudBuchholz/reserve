'use strict'

const assert = require('assert')
const { newEventEmitter, ...events } = require('./EventEmitter')
const { EVENT_READY, EVENT_INCOMING } = events

describe('EventEmitter', () => {
  describe('events', () => {
    const expected = 'created,ready,incoming,error,redirecting,redirected,aborted,closed'.split(',')
    expected.forEach(name => {
      const constantName = 'EVENT_' + name.toUpperCase()
      it(`exposes ${constantName}`, () => {
        assert.notStrictEqual(events[constantName], undefined)
      })
    })
  })

  describe('allocation', () => {
    let on, emit

    beforeEach(() => {
      const allocated = newEventEmitter()
      on = allocated.on
      emit = allocated.emit
    })

    it('exposes two functions', () => {
      assert.strictEqual(typeof on, 'function')
      assert.strictEqual(typeof emit, 'function')
    })

    describe('on', () => {
      it('validates the event name (unknown)', () => {
        assert.throws(() => on('unknown', () => {}))
      })

      it('validates the callback parameter', () => {
        assert.throws(() => on('ready'))
      })

      it('validates the event name and callback', () => {
        assert.doesNotThrow(() => on('ready', () => {}))
      })
    })

    describe('emit', () => {
      it('does not fail if no event is registered', () => {
        emit(EVENT_READY)
      })

      it('forwards event to registered callbacks only', () => {
        let readyTriggered = false
        on('ready', () => {
          readyTriggered = true
        })
        emit(EVENT_INCOMING)
        assert.strictEqual(readyTriggered, false)
      })

      it('forwards event to registered callbacks', () => {
        let readyTriggered = false
        on('ready', () => {
          readyTriggered = true
        })
        emit(EVENT_READY)
        assert.strictEqual(readyTriggered, true)
      })
    })
  })
})
