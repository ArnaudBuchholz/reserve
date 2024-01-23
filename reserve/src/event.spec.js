'use strict'

const assert = require('assert')
const { newEventEmitter, ...events } = require('./event')
const { EVENT_CREATED, EVENT_READY, EVENT_INCOMING } = events

describe('event', () => {
  describe('constants', () => {
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

      it('enables chaining', () => {
        const object = { on }
        assert.strictEqual(object.on('ready', () => {}), object)
      })

      it('supports *', () => {
        assert.doesNotThrow(() => on('*', () => {}))
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

      it('protects against most callback failure', () => {
        on('ready', () => {
          throw new Error('FAILED!')
        })
        assert.doesNotThrow(() => emit(EVENT_READY))
      })

      it('does not protect against \'created\' failure', () => {
        on('created', () => {
          throw new Error('FAILED!')
        })
        assert.throws(() => emit(EVENT_CREATED))
      })

      it('merges emit parameters to build one event object', () => {
        let error
        on('ready', (event) => {
          try {
            assert.strictEqual(event.eventName, 'ready')
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

      it('supports *', () => {
        let triggered = 0
        on('*', () => { ++triggered })
        emit(EVENT_READY)
        emit(EVENT_INCOMING)
        assert.strictEqual(triggered, 2)
      })
    })
  })
})
