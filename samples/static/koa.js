const Koa = require('koa')
const { KOA_PORT: PORT } = require('./ports.js')
const { join } = require('path')
const send = require('koa-send')

const app = new Koa()

app.use(async (ctx, next) => {
  if (ctx.path !== '/hello') {
    return await next()
  }
  ctx.body = 'Hello World !'
})

app.use(async (ctx) => {
  await send(ctx, ctx.path, { root: join(__dirname, 'www') })
})

app.listen(PORT, (err) => {
  if (err) throw err
  console.log(`koa listening on port ${PORT}`)
})
