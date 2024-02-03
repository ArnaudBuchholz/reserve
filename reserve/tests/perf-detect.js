const assert = require('assert')

const tests = [{
  i: '/a',
  e: false
}, {
  i: '/a%2eb',
  e: true
}, {
  i: '/a%2eb',
  e: true
}]

const re = /%|\./

module.exports = (config) => new Promise(resolve => {
  resolve({
    re: () => {
      for (const { i, e } of tests) {
        const o = !!i.match(re)
        assert.strictEqual(o, e)
      }
    },
    index: () => {
      for (const { i, e } of tests) {
        const o = !!(i.indexOf('%') !== -1 || i.indexOf('.') !== -1)
        assert.strictEqual(o, e)
      }
    }
  }[config])
})
