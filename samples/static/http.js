const http = require('http')
const { readFileSync } = require('fs')

const host = 'localhost'
const port = 8083

const page = readFileSync('www/index.html').toString()

const requestListener = function (req, res) {
  if (req.url === '/hello') {
    res.writeHead(200, {
      'content-type': 'text/plain',
      'content-length': 13
    })
    res.end('Hello World !')
  } else {
    res.writeHead(200, {
      'content-type': 'text/html',
      'content-length': page.length
    })
    res.end(page)
  }
}

const server = http.createServer(requestListener)
server.listen(port, host, () => {
  console.log(`raw http listening on port ${port}`)
})
