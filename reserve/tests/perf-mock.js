const { mock, send, Request, Response } = require('../src')

module.exports = (config) => new Promise(resolve => {
  if (config === 'base') {
    resolve(async () => {
      // eslint-disable-next-line no-unused-vars
      const request = new Request({ method: 'GET', url: '/hello' })
      const response = new Response()
      await send(response, 'Hello World !')
      await response.waitForFinish()
    })
    return
  }

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
