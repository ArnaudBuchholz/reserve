'use strict'

const fs = require('fs')
const path = require('path')
const util = require('util')
const statAsync = util.promisify(fs.stat)

const ns = 'REserve/custom@'
const $path = Symbol(`${ns}path`)
const $callback = Symbol(`${ns}callback`)
const $timestamp = Symbol(`${ns}timestamp`)

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
      mapping[$path] = path.join(mapping.cwd, mapping.custom)
      mapping[$callback] = require(mapping[$path])
      if (mapping.watch) {
        mapping[$timestamp] = (await statAsync(mapping[$path])).mtimeMs
      }
    } else {
      mapping[$callback] = mapping.custom
    }
  },
  redirect: async ({ mapping, match, request, response }) => {
    if (mapping[$timestamp]) {
      const timestamp = (await statAsync(mapping[$path])).mtimeMs
      if (timestamp !== mapping[$timestamp]) {
        mapping[$timestamp] = timestamp
        delete require.cache[mapping[$path]]
        mapping[$callback] = require(mapping[$path])
      }
    }
    // Include timeout?
    const parameters = [request, response].concat([].slice.call(match, 1))
    return mapping[$callback].apply(mapping, parameters)
  }
}
