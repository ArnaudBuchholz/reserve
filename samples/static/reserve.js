const { check, serve, send } = require('../../reserve/src/index.js')

const perfData = []

check({
  cwd: __dirname,
  port: 8080,
  mappings: [{
    match: '^/static',
    custom: async (request, response) => {
      send(response, 'Hello World !')
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
    id,
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
