const { Request } = require('../..')

function push (configuration, path, response) {
  response.createPushResponse({
    ':method': 'GET',
    ':path': path
  }, (err, res) => {
    if (!err) {
      configuration.dispatch(new Request('GET', path), res)
    }
  })
}

module.exports = function (request, response) {
  for (let i = 0; i < 100; ++i) {
    push(this.configuration, `/http2-${i}.svg`, response)
  }
}
