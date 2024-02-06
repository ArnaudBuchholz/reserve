'use strict'

const { Socket } = require('../node-api')

module.exports = function (port, {
  timeout = 400,
  host = '127.0.0.1'
} = {}) {
  return new Promise(resolve => {
    const socket = new Socket()
    let status = false

    socket.setTimeout(timeout)
    socket
      .on('connect', () => {
        status = true
        socket.destroy()
      })
      .on('timeout',
        /* istanbul ignore next */ // Hard to reproduce
        () => {
          socket.destroy()
        }
      )
      .on('error', () => {})
      .on('close', () => {
        resolve(status)
      })

    socket.connect(port, host)
  })
}
