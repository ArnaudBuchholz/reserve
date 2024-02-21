'use strict'

const { statSync } = require('fs')
const stat = statSync('dist/core.js')
console.log('core.js', stat.size)
