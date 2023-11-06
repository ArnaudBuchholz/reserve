const { networkInterfaces } = require('./node-api')

module.exports = () => {
  let hostname = '127.0.0.1'
  const networks = networkInterfaces()
  for (const name of Object.keys(networks)) {
    for (const network of networks[name]) {
      if (!network.internal && (network.family === 'IPv4' || network.family === 4)) {
        hostname = network.address
        break
      }
    }
  }
  return hostname
}
