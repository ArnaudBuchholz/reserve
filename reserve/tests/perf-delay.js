module.exports = async (receivedDelay = '100') => {
  const delay = parseInt(receivedDelay, 10)
  return () => new Promise(resolve => setTimeout(resolve, delay))
}
