'use strict'

const assert = require('./assert')
const { clean, collect } = require('./mocked_modules/console')
const logError = require('../../logError')

describe('logError', () => {
  beforeEach(clean)

  it('logs errors non related to requests', () => {
    logError({
      reason: 'REASON',
      id: 3475 // hex is 0D93
    })
    const output = collect()
    assert(() => output.length === 1)
    assert(() => output[0].type === 'error')
    assert(() => output[0].text.includes('REASON'))
    assert(() => !output[0].text.includes('3475'))
    assert(() => !output[0].text.includes('D93'))
  })
})
