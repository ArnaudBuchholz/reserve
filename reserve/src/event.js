'use strict'

const names = 'created,ready,incoming,error,redirecting,redirected,aborted,closed'.split(',')

function newEventEmitter () {
  const registry = []

  const register = (event, callback) => {
    const eventIndex = names.indexOf(event)
    if (eventIndex === -1) {
      throw new Error('Unknown event name')
    }
    if (typeof callback !== 'function') {
      throw new Error('Invalid callback')
    }
    if (registry[eventIndex] === undefined) {
      registry[eventIndex] = []
    }
    registry[eventIndex].push(callback)
  }

  const on = function (event, callback) {
    if (event === '*') {
      names.forEach(name => register(name, callback))
    } else {
      register(event, callback)
    }
    return this
  }

  const emit = (eventIndex, ...parameters) => {
    const callbacks = registry[eventIndex]
    if (callbacks !== undefined) {
      const event = Object.assign({
        eventName: names[eventIndex]
      }, ...parameters)
      try {
        for (const callback of callbacks) {
          callback(event)
        }
      } catch (e) {
        if (eventIndex === 0) {
          throw e
        }
      }
      return callbacks.length
    }
    return 0
  }

  return { on, emit }
}

module.exports = {
  newEventEmitter,
  EVENT_CREATED: 0,
  EVENT_READY: 1,
  EVENT_INCOMING: 2,
  EVENT_ERROR: 3,
  EVENT_REDIRECTING: 4,
  EVENT_REDIRECTED: 5,
  EVENT_ABORTED: 6,
  EVENT_CLOSED: 7
}
