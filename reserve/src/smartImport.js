const { isAbsolute } = require('./node-api')

module.exports = async (path) => {
  if (isAbsolute(path) && (path.endsWith('.mjs') || typeof require === 'undefined')) {
    return (await import(`file://${path}`)).default
  }
  return require(path)
}
