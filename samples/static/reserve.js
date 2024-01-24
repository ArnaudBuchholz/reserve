const { check, serve, send, punycache } = require('../../reserve/src/index.js')
const { createReadStream, stat, readFileSync } = require('fs')

const perfStats = {}
const fileStatCache = punycache()
const INDEX_PATH = './www/index.html'
const INDEX_CONTENT = readFileSync(INDEX_PATH).toString()

check({
  cwd: __dirname,
  port: 8080,
  mappings: [{
    match: '^/stream',
    custom: async request => {
      let pendingFileStat = fileStatCache.get(INDEX_PATH)
      if (!pendingFileStat) {
        pendingFileStat = new Promise((resolve, reject) => stat(INDEX_PATH, (err, fileStat) => err ? reject(err) : resolve(fileStat)))
        fileStatCache.set(INDEX_PATH, pendingFileStat)
      }
      request.fileStat = await pendingFileStat
    }
  }, {
    match: '^/stream',
    custom: async (request, response) => {
      const stream = createReadStream(INDEX_PATH)
      await send(response, stream, {
        headers: {
          'content-type': 'text/html',
          'content-length': request.fileStat.size
        }
      })
    }
  }, {
    match: '^/static',
    custom: async (request, response) => {
      send(response, INDEX_CONTENT)
    }
  }, {
    match: '^/hello',
    custom: async (request, response) => {
      await send(response, 'Hello World !')
    }
  }, {
    match: '^/hello-fast',
    custom: async (request, response) => {
      response.writeHead(200, {
        'content-type': 'text/plain',
        'content-length': 13
      })
      response.end('Hello World !')
    }
  }, {
    match: '^/(.*)',
    file: './www/$1'
  }]
})
  .then(configuration => {
    const server = serve(configuration)
      .on('ready', ({ port }) => {
        console.log(`reserve listening on port ${port}`)
      })
  })
