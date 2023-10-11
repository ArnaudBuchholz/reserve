const commonjs = require('@rollup/plugin-commonjs')

module.exports = {
  input: 'src/index.js',
  output: {
    dir: 'dist',
    format: 'cjs'
  },
  plugins: [commonjs()]
}
