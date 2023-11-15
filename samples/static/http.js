const http = require('http')
const { readFileSync } = require('fs')

const host = 'localhost'
const port = 8083

const page = readFileSync('www/index.html').toString()

const requestListener = function (req, res) {
  res.writeHead(200, {
    'content-type': 'text/html',
    'content-length': page.length
  })
  res.end(page)
}

const server = http.createServer(requestListener)
server.listen(port, host, () => {
  console.log(`raw http listening on port ${port}`)
})
