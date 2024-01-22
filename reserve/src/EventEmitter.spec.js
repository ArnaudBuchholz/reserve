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

      it('forwards event to registered callback', () => {
        let readyTriggered = false
        on('ready', () => {
          readyTriggered = true
        })
        emit(EVENT_READY)
        assert.strictEqual(readyTriggered, true)
      })

      it('forwards event to registered callbacks', () => {
        let readyTriggered = ''
        on('ready', () => {
          readyTriggered += 'A'
        })
        on('ready', () => {
          readyTriggered += 'B'
        })
        emit(EVENT_READY)
        assert.strictEqual(readyTriggered, 'AB')
      })

      it('protects against callback failure', () => {
        on('ready', () => {
          throw new Error('FAILED!')
        })
        assert.doesNotThrow(() => emit(EVENT_READY))
      })

      it('merges emit parameters to build one event object', () => {
        let error
        on('ready', (event) => {
          try {
            assert.strictEqual(event.type, 'ready')
            assert.strictEqual(event.a, 'a')
            assert.strictEqual(event.b, 'b')
            assert.strictEqual(event.c, 'c')
          } catch (e) {
            error = e
          }
        })
        emit(EVENT_READY, { a: 'a' }, { b: 'b', c: 'C' }, { c: 'c' })
        if (error) {
          throw error
        }
      })

      it('returns the number of callbacks registered (0)', () => {
        assert.strictEqual(emit(EVENT_READY), 0)
      })

      it('returns the number of callbacks registered (1)', () => {
        on('ready', () => {})
        assert.strictEqual(emit(EVENT_READY), 1)
      })

      it('returns the number of callbacks registered (2)', () => {
        on('ready', () => {})
        on('ready', () => {})
        assert.strictEqual(emit(EVENT_READY), 2)
      })
    })
  })
})
