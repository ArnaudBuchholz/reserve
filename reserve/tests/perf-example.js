module.exports = async () => {
  return async () => {
    await (1 + 1)
    // await new Promise(resolve => setTimeout(resolve, 100))
    await (2 + 2)
    // await new Promise(resolve => setTimeout(resolve, 100))
    await (3 + 3)
  }
}
