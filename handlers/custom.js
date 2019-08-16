'use strict'

const fs = require('fs')
const path = require('path')
const util = require('util')
const statAsync = util.promisify(fs.stat)

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
      mapping._path = path.join(mapping.cwd, mapping.custom)
      mapping._callback = require(mapping._path)
      if (mapping.watch) {
        mapping._timestamp = (await statAsync(mapping._path)).mtimeMs
      }
    } else {
      mapping._callback = mapping.custom
    }
  },
  redirect: async ({ mapping, match, request, response }) => {
    if (mapping._timestamp) {
      const timestamp = (await statAsync(mapping._path)).mtimeMs
      if (timestamp !== mapping._timestamp) {
        mapping._timestamp = timestamp
        delete require.cache[mapping._path]
        mapping._callback = require(mapping._path)
      }
    }
    // Include timeout?
    const parameters = [request, response].concat([].slice.call(match, 1))
    return mapping._callback.apply(mapping, parameters)
  }
}
