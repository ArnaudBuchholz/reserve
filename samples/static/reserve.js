const { check, serve } = require('../../reserve/src/index.js')

const perfData = []

check({
  cwd: __dirname,
  port: 8080,
  mappings: [{
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
  console.table(perfData.map(({
    id,
    perfStart,
    perfEnd,
    perfHandlers
  }) => {
    const round = value => Math.floor(value * 100) / 100
    const ts = round(perfEnd - perfStart)
    let off = perfEnd - perfStart
    const handlers = perfHandlers.map(({ prefix, start, end }) => {
      const spent = end - start
      off -= spent
      return `${prefix}: ${round(spent)}`
    }).join(', ')
    return ({
      id,
      ts,
      handlers,
      off: round(off)
    })
  }))
  process.exit(0)
})
