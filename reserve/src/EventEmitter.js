'use strict'

const SERVER_CREATED = 0
ready = 'ready',
incoming = 'incoming',
error = 'error',
redirecting = 'redirecting',
redirected = 'redirected',
aborted = 'aborted',
closed = 'closed'

module.exports = {

  factory () {
    const registry = []

    const on = (name, callback) => {
      const index = ...
      if (registry[index] === undefined) {
        registry[index] = []
      }
      registry[index].push(callback)
    }

    const emit = (event, parameters) => {
      for (const callback of registry[event]) {
        callback(parameters)
      }
    }

    return {
      on,
      emit
    }
  }
} 