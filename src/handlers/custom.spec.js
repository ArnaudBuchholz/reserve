'use strict'

const { assert, wrapHandler } = require('test-tools')
const customHandler = require('./custom')

const handle = wrapHandler(customHandler, {
  mapping: {
    custom: () => {}
  }
})

const {
  $configuration
} = require('../symbols')

describe('handlers/custom', () => {
  it('validates the custom function', async () => {
    let exceptionCaught
    try {
      await customHandler.validate({
        custom: false
      })
    } catch (e) {
      exceptionCaught = e
    }
    assert(() => !!exceptionCaught)
  })

  it('returns a promise', () => handle({ request: '/any' })
    .then(({ promise }) => {
      assert(() => typeof promise.then === 'function')
    })
  )

  it('calls the function with the proper parameters', () => handle({
    request: '/any',
    match: ['capturing groups are: ', 'first', 'second'],
    mapping: {
      custom: function () {
        return arguments
      }
    }
  })
    .then(({ promise, request, response }) => promise.then(args => {
      assert(() => args.length === 4)
      assert(() => args[0] === request)
      assert(() => args[1] === response)
      assert(() => args[2] === 'first')
      assert(() => args[3] === 'second')
    }))
  )

  it('waits for the function result if a promise', () => handle({
    request: '/any',
    mapping: {
      custom: async () => 'OK'
    }
  })
    .then(({ promise }) => promise.then(value => {
      assert(() => value === 'OK')
    }))
  )

  it('lets any exception flow (will be intercepted by dispatcher)', () => handle({
    request: '/any',
    mapping: {
      custom: () => { throw new Error('KO') }
    }
  })
    .then(({ promise }) => promise.then(assert.notExpected, reason => {
      assert(() => reason.message === 'KO')
    }))
  )

  it('returns any rejected promise (will be intercepted by dispatcher)', () => handle({
    request: '/any',
    mapping: {
      custom: async () => { throw new Error('KO') }
    }
  })
    .then(({ promise }) => promise.then(assert.notExpected, reason => {
      assert(() => reason.message === 'KO')
    }))
  )

  it('passes configuration on mapping if member not defined', () => handle({
    request: '/any',
    mapping: {
      custom: () => {}
    }
  })
    .then(({ mapping, promise }) => promise.then(() => {
      assert(() => mapping.configuration[$configuration])
    }))
  )

  it('does not pass configuration on mapping if member is defined', () => handle({
    request: '/any',
    mapping: {
      custom: () => {},
      configuration: {}
    }
  })
    .then(({ mapping, promise }) => promise.then(() => {
      assert(() => !mapping.configuration[$configuration])
    }))
  )
})
