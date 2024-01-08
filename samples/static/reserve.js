const { check, serve, send, punycache } = require('../../reserve/src/index.js')
const { createReadStream, stat, readFileSync } = require('fs')
const { pipeline } = require('stream')

const perfData = []
const fileStatCache = punycache({
  ttl: 500
})
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
      response.writeHead(200, {
        'content-type': 'text/html',
        'content-length': request.fileStat.size
      })
      const stream = createReadStream(INDEX_PATH)
      await new Promise(resolve => pipeline(stream, response, () => resolve()))
    }
  }, {
    match: '^/static',
    custom: async (request, response) => {
      send(response, INDEX_CONTENT)
    }
  }, {
    match: '^/(.*)',
    file: './www/$1'
  }]
})
  .then(configuration => {
    serve(configuration)
      .on('ready', ({ port }) => {
        console.log(`reserve listening on port ${port}`)
      })
      .on('redirected', data => perfData.push(data))
  })

process.on('SIGINT', () => {
  const round = value => Math.floor(value * 100) / 100
  const stats = {}
  perfData.forEach(({
    url,
    perfStart,
    perfEnd,
    perfHandlers
  }) => {
    const ts = perfEnd - perfStart
    const urlStats = stats[url] ??= {
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
    perfHandlers.forEach(({ prefix, start, end }, index) => {
      const ts = end - start
      const handlerStats = urlStats.handlers[index] ??= {
        prefix,
        min: Number.POSITIVE_INFINITY,
        max: 0,
        tsSummed: 0
      }
      handlerStats.min = Math.min(handlerStats.min, ts)
      handlerStats.max = Math.max(handlerStats.max, ts)
      handlerStats.tsSummed += ts
    })
  })
  console.table(Object.values(stats).map(({
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
      tsSummed
    }, index) => {
      handlersInfos[`handler${index}`] = prefix
      handlersInfos[`minh${index}`] = round(min)
      handlersInfos[`maxh${index}`] = round(max)
      handlersInfos[`avgh${index}`] = round(tsSummed / count)
      return handlersInfos
    }, {})
  })))
  process.exit(0)
})
