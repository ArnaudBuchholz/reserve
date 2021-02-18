module.exports = (request, response) => {
  response.createPushResponse({
    ":method": "GET",
    ":path": "/pushed.js"
  }, (err, res) => {
      console.log(err)
      try {
        res.setHeader("content-type", "application/javascript")
        res.end("var msg = \"Hello World !\";")
      } catch (e) {
          console.error(e)
      }
  })
}