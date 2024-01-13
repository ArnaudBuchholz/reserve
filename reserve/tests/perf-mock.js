const { mock, send } = require('../src')

module.exports = () => new Promise(resolve => {
  const mocked = mock({
    mappings: [{
      match: /^\/hello/,
      custom: function (request, response) {
        return send(response, 'Hello World !')
      }
    }]
  })
  mocked.on('ready', () => {
    resolve(async () => {
      const response = await mocked.request({ method: 'GET', url: '/hello' })
      await response.waitForFinish()
    })
  })
})
