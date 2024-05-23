const http = require('http')
const { createReadStream, stat } = require('fs')
const { join, extname } = require('path')
const { NATIVE_PORT: PORT } = require('./ports.js')
const { pipeline } = require('stream')
const mime = require('mime')

const host = 'localhost'

const requestListener = function (request, response) {
  const { url } = request
  if (url === '/hello') {
    response.writeHead(200, {
      'content-type': 'text/plain',
      'content-length': 13
    })
    response.end('Hello World !')
  } else {
    const path = join(__dirname, 'www', url)
    stat(path, (err, fileStat) => {
      if (err) {
        response.writeHead(500)
        response.end()
      } else {
        response.writeHead(200, {
          'content-type': mime.getType(extname(path)),
          'content-length': fileStat.size
        })
        const stream = createReadStream(path)
        pipeline(stream, response, err => {
          if (err) {
            response.end()
          }
        })
      }
    })
  }
}

const server = http.createServer(requestListener)
server.listen(PORT, host, () => {
  console.log(`raw http listening on port ${PORT}`)
})
