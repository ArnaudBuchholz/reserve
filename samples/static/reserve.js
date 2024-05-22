const { join } = require('path')
let reserve;
if (process.argv.includes('--source')) {
  reserve = require(join(__dirname, '../../reserve/src/'))
} else {
  reserve = require('reserve')
}
const { serve, send, punycache } = reserve
const { createReadStream, stat, readFileSync } = require('fs')
const { RESERVE_PORT: PORT } = require('./ports.js')
const v8 = require('v8')

const fileStatCache = punycache()
const INDEX_PATH = './www/index.html'
const INDEX_CONTENT = readFileSync(INDEX_PATH).toString()

serve({
  cwd: __dirname,
  port: PORT,
  mappings: [{
    match: '/healthcheck',
    custom: (_, response) => send(response, {
      memory: process.memoryUsage(),
      v8Heap: v8.getHeapStatistics()
    })
  }, {
    match: '/stream',
    custom: async request => {
      let pendingFileStat = fileStatCache.get(INDEX_PATH)
      if (!pendingFileStat) {
        pendingFileStat = new Promise((resolve, reject) => stat(INDEX_PATH, (err, fileStat) => err ? reject(err) : resolve(fileStat)))
        fileStatCache.set(INDEX_PATH, pendingFileStat)
      }
      request.fileStat = await pendingFileStat
    }
  }, {
    match: '/stream',
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
    match: '/static',
    custom: async (request, response) => {
      send(response, INDEX_CONTENT)
    }
  }, {
    match: '/hello',
    custom: async (request, response) => {
      await send(response, 'Hello World !')
    }
  }, {
    match: '/hello-fast',
    custom: async (request, response) => {
      response.writeHead(200, {
        'content-type': 'text/plain',
        'content-length': 13
      })
      response.end('Hello World !')
    }
  }, {
    file: './www/$1'
  }, {
    status: 404
  }]
})
  .on('ready', ({ port }) => {
    console.log(`REserve listening on port ${port}`)
  })
