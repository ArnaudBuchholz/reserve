const { join, sep } = require('path')

module.exports = () => join('cjs', 'OK').replace(sep, ':')
