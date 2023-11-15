const http = require('http')
const { createReadStream, stat } = require('fs')
const { pipeline } = require('stream')

const host = 'localhost'
const port = 8084

const path = 'www/index.html'
const delay = 500

function perfStat (filePath) {
  const now = Date.now()
  let promise = perfStat.cache[filePath]
  if (!promise || (now - promise.when) > delay) {
    promise = new Promise((resolve, reject) => stat(path, (err, fileStat) => err ? reject(err) : resolve(fileStat)))
    console.log(now)
    promise.when = now
    perfStat.cache[filePath] = promise
  }
  return promise
}
perfStat.cache = {}

const requestListener = function (req, res) {
  perfStat(path).then(fileStat => {
    res.writeHead(200, {
      'content-type': 'text/html',
      'content-length': fileStat.size
    })
    const stream = createReadStream(path)
    pipeline(stream, res, () => {})
  })
}

const server = http.createServer(requestListener)
server.listen(port, host, () => {
  console.log(`http-stream listening on port ${port}`)
})
