'use strict'

const names = 'created,ready,incoming,error,redirecting,redirected,aborted,closed'.split(',')
const events = {}
names.forEach((name, index) => {
  events['EVENT_' + name.toUpperCase()] = index
})

module.exports = {
  ...events,

  newEventEmitter () {
    const registry = []

    const on = (event, callback) => {
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

    const emit = (eventIndex) => {
      const callbacks = registry[eventIndex]
      if (callbacks !== undefined) {
        const event = {
          type: names[eventIndex]
        }
        try {
          for (const callback of callbacks) {
            callback(event)
          }
        } catch (e) {
          // absorb
        }
      }
    }

    return { on, emit }
  }

  // factory () {
  //   const registry = []

  //   const on = (name, callback) => {
  //     const index = ...
  //     if (registry[index] === undefined) {
  //       registry[index] = []
  //     }
  //     registry[index].push(callback)
  //   }

  //   const emit = (event, parameters) => {
  //     for (const callback of registry[event]) {
  //       callback(parameters)
  //     }
  //   }

  //   return {
  //     on,
  //     emit
  //   }
  // }
}
