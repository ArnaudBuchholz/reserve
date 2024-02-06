module.exports = async (path) => {
  if (path.endsWith('.mjs')) {
    return (await import(`file://${path}`)).default
  }
  try {
    return require(path)
  } catch (e) {
    /* istanbul ignore next */ // Not easy to reproduce with mocha
    if (e.code === 'ERR_REQUIRE_ESM') {
      return (await import(`file://${path}`)).default
    }
    throw e
  }
}
