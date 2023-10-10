'use strict'

const mockRequire = require('mock-require')
const { assert, wrapHandler } = require('test-tools')
const customHandler = require('./custom')

const handle = wrapHandler(customHandler, {
  mapping: {
    custom: () => {}
  }
})

const {
  $configuration,
  $customTimestamp
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

  it('implements file watching (timestamp changes)', async () => {
    const mapping = {
      cwd: '/',
      custom: 'now.js',
      watch: true
    }

    mockRequire('/now.js', (request, response) => { response.end('first') })
    let timestamp1
    await handle({
      request: '/any',
      mapping
    })
      .then(({ mapping, promise, response }) => promise.then(value => {
        assert(() => value === undefined)
        assert(() => response.toString() === 'first')
        timestamp1 = mapping[$customTimestamp]
        assert(() => timestamp1)
      }))

    mockRequire('/now.js', (request, response) => { response.end('second') })
    await handle({
      request: '/any',
      mapping
    })
      .then(({ mapping, promise, response }) => promise.then(value => {
        assert(() => value === undefined)
        assert(() => response.toString() === 'second')
        assert(() => mapping[$customTimestamp] !== timestamp1)
      }))
  })

  it('implements file watching (timestamp remains the same)', async () => {
    const mapping = {
      cwd: '/',
      custom: 'not-now.js',
      watch: true
    }

    mockRequire('/not-now.js', (request, response) => { response.end('first') })
    let timestamp1
    await handle({
      request: '/any',
      mapping
    })
      .then(({ mapping, promise, response }) => promise.then(value => {
        assert(() => value === undefined)
        assert(() => response.toString() === 'first')
        timestamp1 = mapping[$customTimestamp]
        assert(() => timestamp1)

        mockRequire('/not-now.js', assert.notExpected)
        return handle({
          request: '/any',
          mapping
        })
      }))
      .then(({ mapping, promise, response }) => promise.then(value => {
        assert(() => value === undefined)
        assert(() => response.toString() === 'first')
        assert(() => mapping[$customTimestamp] === timestamp1)
      }))
  })

  it('passes configuration on mapping if member not defined', () => handle({
    request: '/any',
    mapping: {
      custom: () => {}
    }
  })
    .then(({ mapping, promise }) => promise.then(() => {
      assert(() => mapping.configuration[$configuration])
      assert(() => !mapping.configuration[$customTimestamp])
    }))
  )

  it('does not pass configuration on mapping if member is defined', () => handle({
    request: '/any',
    mapping: {
      custom: () => {},
      configuration: {
        [$customTimestamp]: 'whatever'
      }
    }
  })
    .then(({ mapping, promise }) => promise.then(() => {
      assert(() => mapping.configuration[$customTimestamp])
      assert(() => !mapping.configuration[$configuration])
    }))
  )
})
