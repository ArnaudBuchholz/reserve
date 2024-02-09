'use strict'

const { describe, it } = require('mocha')
const assert = require('assert')
const normalize = require('./normalize')

describe('helpers/normalize', () => {
  const tests = {
    'file.txt': '/file.txt',
    '/../file.txt': '/file.txt',
    '/test/../file.txt': '/file.txt',
    '/%2E%2E/file.txt': '/file.txt',
    '/test/%2E%2E/file.txt': '/file.txt',
    '/file%00.txt': '/file.txt',
    '/file%0.txt': 400,
    '/file%-.txt': 400,
    '/file%%.txt': 400
  }

  for (let i = 1; i < 32; ++i) {
    tests[`/file${i}%${Number(i).toString(16).padStart(2, '0')}.txt`] = `/file${i}.txt`
  }

  Object.keys(tests).forEach(url => {
    const expected = tests[url]
    it(`${url} ⇒ ${expected}`, () => {
      assert.strictEqual(normalize(url), expected)
    })
  })
})
