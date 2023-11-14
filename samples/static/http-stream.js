const http = require('http')
const { createReadStream, stat } = require('fs')
const { pipeline } = require('stream')
const host = 'localhost'
const port = 8084

const path = 'www/index.html'

const requestListener = function (req, res) {
  stat(path, (err, fileStat) => {
    res.writeHead(200, {
      'content-type': 'text/html',
      'content-length': fileStat.size
    })
    stream = createReadStream(path)
    pipeline(stream, res, () => {})
  })
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
  console.log(`Listening on port ${port}`)
});