'use strict'

const fs = require('fs')
const path = require('path')
const util = require('util')
const statAsync = util.promisify(fs.stat)

const {
  $customPath,
  $customCallback,
  $customConfiguration,
  $customTimestamp
} = require('../symbols')

module.exports = {
  schema: {
    custom: ['function', 'string'],
    watch: {
      type: 'boolean',
      defaultValue: false
    }
  },
  validate: async mapping => {
    if (typeof mapping.custom === 'string') {
      mapping[$customPath] = path.join(mapping.cwd, mapping.custom)
      mapping[$customCallback] = require(mapping[$customPath])
      if (mapping.watch) {
        mapping[$customTimestamp] = (await statAsync(mapping[$customPath])).mtimeMs
      }
    } else {
      mapping[$customCallback] = mapping.custom
    }
    if (typeof mapping[$customCallback] !== 'function') {
      throw new Error('Invalid custom handler, expected a function')
    }
    if (mapping.configuration === undefined) {
      mapping[$customConfiguration] = true
    }
  },
  redirect: async ({ configuration, mapping, match, request, response }) => {
    if (mapping[$customTimestamp]) {
      const timestamp = (await statAsync(mapping[$customPath])).mtimeMs
      if (timestamp !== mapping[$customTimestamp]) {
        mapping[$customTimestamp] = timestamp
        delete require.cache[mapping[$customPath]]
        mapping[$customCallback] = require(mapping[$customPath])
      }
    }
    // Include timeout?
    const parameters = [request, response].concat([].slice.call(match, 1))
    if (mapping[$customConfiguration]) {
      mapping.configuration = configuration
    }
    return mapping[$customCallback].apply(mapping, parameters)
  }
}
