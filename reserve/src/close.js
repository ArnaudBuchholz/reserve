'use strict'

const { $configurationRequests } = require('./symbols')
const defer = require('./helpers/defer')

module.exports = async (configuration, options) => {
  const {
    timeout = 0,
    force = false
  } = options || {}
  if (timeout > 0) {
    const pending = Array.from(configuration[$configurationRequests].contexts.values()).map(({ holding }) => holding)
    const [timedOutPromise, timedOut] = defer()
    const timeoutId = setTimeout(() => timedOut(), timeout)
    await Promise.race([
      Promise.all(pending),
      timedOutPromise
    ])
    clearTimeout(timeoutId)
  }
  if (force) {
    for (const { request } of configuration[$configurationRequests].contexts.values()) {
      request.destroy()
    }
  }
}
