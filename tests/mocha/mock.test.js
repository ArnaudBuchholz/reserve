'use strict'

const assert = require('./assert')
const mock = require('../../mock')
const { read } = require('../../configuration')

describe('mock', () => {
  describe('keeping the original handlers', () => {
    let mocked
    before(() => read('reserve.json')
      .then(configuration => mock(configuration))
      .then(eventEmitter => {
        mocked = eventEmitter
      })
    )

    it('simulates a request and returns a response', () => mocked.request('GET', '/file.txt')
      .then(response => {
        assert(() => response.finished)
        assert(() => response.statusCode === 200)
        assert(() => response.toString() === 'Hello World!')
      })
    )
  })
  describe('overriding the handlers', () => {
    let mocked
    before(() => read('reserve.json')
      .then(configuration => mock(configuration, {
        file: {
          redirect: async ({ request, mapping, redirect, response }) => {
            if (redirect === '/') {
              response.writeHead(201, {
                'Content-Type': 'text/plain',
                'Content-Length': 5
              })
              response.end('ABCDE')
            } else {
              return 500
            }
          }
        }
      }))
      .then(eventEmitter => {
        mocked = eventEmitter
      })
    )

    it('simulates a request and returns a response', () => mocked.request('GET', '/')
      .then(response => {
        assert(() => response.finished)
        assert(() => response.statusCode === 201)
        assert(() => response.toString() === 'ABCDE')
      })
    )

    it('suports internal redirection', () => mocked.request('GET', '/error')
      .then(response => {
        assert(() => response.finished)
        assert(() => response.statusCode === 500)
      })
    )
  })
})
