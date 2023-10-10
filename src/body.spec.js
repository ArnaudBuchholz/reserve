'use strict'

const { assert } = require('test-tools')
const body = require('./body')
const EventEmitter = require('events')

function request (chunks) {
  const eventEmitter = new EventEmitter()
  function loop () {
    if (!chunks.length) {
      eventEmitter.emit('end')
    } else {
      const chunk = chunks.shift()
      if (chunk instanceof Error) {
        eventEmitter.emit('error', chunk)
      } else {
        eventEmitter.emit('data', chunk)
      }
      setTimeout(loop, 0)
    }
  }
  setTimeout(loop, 0)
  return eventEmitter
}

describe('body', () => {
  it('deserializes the request body', async () => body(request([
    'Hello',
    ' World',
    ' !'
  ]))
    .then(text => assert(() => text === 'Hello World !'), assert.notExpected)
  )

  it('forwards the error', async () => body(request([
    'Hello',
    ' World',
    new Error('fail')
  ]))
    .then(assert.notExpected, reason => assert(() => reason.message === 'fail'))
  )
})
