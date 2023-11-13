'use strict'

const nativePath = require('path')
const sep = '/'

require('mock-require')('path', Object.assign({}, nativePath, {
  sep,
  join: (...parts) => nativePath.join.apply(nativePath, parts).replace(/\\/g, sep)
}))
