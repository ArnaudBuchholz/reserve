'use strict'

const { assert } = require('test-tools')

describe('[test-tool] assert', () => {
  it('documents exception if any', () => {
    try {
      assert(() => {
        throw new Error('KO')
      })
    } catch (e) {
      assert(() => e.message.indexOf('KO') !== -1)
    }
  })
})
