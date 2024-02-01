const assert = require('assert')
const { normalize } = require('path')

const input = '/any/../private/secret.txt'
const expected = '/private/secret.txt'
const check = result => assert.strictEqual(result, expected)

module.exports = (config) => new Promise(resolve => {
  resolve({
    base: () => { check(expected) },
    url: () => {
      const url = new URL(input, 'http://localhost').toString()
      const result = url.substring(16)
      check(result)
    },
    normalize: () => {
      const result = normalize(input).replace(/\\/g, '/')
      check(result)
    },
    replace: () => {
      const result = input.replace(/\/[^/]+\/\.\.\//g, '/')
      check(result)
    }
  }[config])
})
