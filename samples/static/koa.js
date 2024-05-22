const Koa = require('koa')
const app = new Koa()
const { KOA_PORT: PORT } = require('./ports.js')

app.use(async (ctx, next) => {
  if (ctx.path !== '/hello') {
    return await next()
  }
  ctx.body = 'Hello World !'
})

app.use(async (ctx) => {
  await send(ctx, ctx.path, { root: __dirname + '/www' })
})

app.listen(PORT, (err, address) => {
  if (err) throw err
  console.log(`koa listening on port ${PORT}`)
})
