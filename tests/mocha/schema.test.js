'use strict'

const assert = require('./assert')
const schemaCheck = require('../../schema')

describe('schema', () => {
  describe('required property', () => {
    it('checks the type', () => {
      var exceptionCaught
      try {
        schemaCheck({
          property: 'string'
        }, {
          property: 'value'
        })
      } catch (e) {
        exceptionCaught = e
      }
      assert(() => !exceptionCaught)
    })
  })
})
