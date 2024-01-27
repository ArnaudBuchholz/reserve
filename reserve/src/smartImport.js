const { isAbsolute } = require('./node-api.js')

module.exports = async (path) => {
  if (isAbsolute(path) && (path.endsWith('.mjs') || typeof require === 'undefined')) {
    return (await import(`file://${path}`)).default
  }
  return require(path)
}
