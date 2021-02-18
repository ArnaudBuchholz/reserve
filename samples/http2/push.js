module.exports = (request, response) => {
  response.createPushResponse({
    ':method': 'GET',
    ':path': '/pushed.js'
  }, (err, res) => {
    setTimeout(function () {
      console.log(err)
      try {
        res.writeHead(200, {
          'content-type': 'application/javascript'
        })
        res.end('var msg = "Hello World !";')
      } catch (e) {
        console.error(e)
      }
    }, 100)
  })
}
