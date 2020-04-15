'use strict'

const { check } = require('../../../mapping')

module.exports = handler => {
  const configuration = {
    handler: mapping => {
      return { handler }
    }
  }
  return async mapping => {
    await check(configuration, mapping)
    return mapping
  }
}
