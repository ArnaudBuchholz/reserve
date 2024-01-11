const { check, serve, send, punycache } = require('../../reserve/src/index.js')
const { createReadStream, stat, readFileSync } = require('fs')

const perfStats = {}
const fileStatCache = punycache()
const INDEX_PATH = './www/index.html'
const INDEX_CONTENT = readFileSync(INDEX_PATH).toString()

const round = value => Math.floor(value * 100) / 100

const report = process.argv.includes('--report')
if (report) {
  console.warn('Recording statistics, this may slow down reserve')
}

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
    if (report) {
      server.on('redirected', ({
        url,
        perfStart,
        perfEnd,
        perfHandlers
      }) => {
        const ts = perfEnd - perfStart
        const urlStats = perfStats[url] ??= {
          url,
          count: 0,
          min: Number.POSITIVE_INFINITY,
          max: 0,
          tsSummed: 0,
          handlers: []
        }
        ++urlStats.count
        urlStats.min = Math.min(urlStats.min, ts)
        urlStats.max = Math.max(urlStats.max, ts)
        urlStats.tsSummed += ts
        const { count } = urlStats
        let index = 0
        for (const { prefix, start, end } of perfHandlers) {
          const ts = end - start
          const handlerStats = urlStats.handlers[index] ??= {
            prefix,
            min: Number.POSITIVE_INFINITY,
            max: 0,
            tsSummed: 0,
            anomalies: 0
          }
          handlerStats.min = Math.min(handlerStats.min, ts)
          handlerStats.max = Math.max(handlerStats.max, ts)
          handlerStats.tsSummed += ts
          if (count > 100) {
            const avg = handlerStats.tsSummed / count
            if (ts > avg * 2) {
              ++handlerStats.anomalies
            }
          }
          ++index
        }
      })
    }
  })

process.on('SIGINT', () => {
  if (report) {
    console.table(Object.values(perfStats).map(({
      url,
      min,
      max,
      tsSummed,
      count,
      handlers
    }) => ({
      url,
      count,
      min: round(min),
      max: round(max),
      avg: round(tsSummed / count),
      ...handlers.reduce((handlersInfos, {
        prefix,
        min,
        max,
        tsSummed,
        anomalies
      }, index) => {
        handlersInfos[`handler${index}`] = prefix
        handlersInfos[`minh${index}`] = round(min)
        handlersInfos[`maxh${index}`] = round(max)
        const avg = round(tsSummed / count)
        handlersInfos[`avgh${index}`] = avg
        handlersInfos[`>avg*2h${index}`] = anomalies
        return handlersInfos
      }, {})
    })))
  }
  process.exit(0)
})
