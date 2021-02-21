const { Request } = require('../..')

module.exports = function (request, response) {
  for (let i = 0; i < 100; ++i) {
    response.createPushResponse({
      ':method': 'GET',
      ':path': `/http2-${i}.svg`
    }, (err, res) => {
      if (!err) {
        this.configuration.dispatch(new Request('GET', `/http2-${i}.svg`), res)
      }
    })
  }
}
