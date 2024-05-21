const Koa = require('koa')
const app = new Koa()

const port = 8084

app.use(async (ctx, next) => {
  if (ctx.path !== '/hello') {
    return await next()
  }
  ctx.body = 'Hello World !'
})

app.use(async (ctx) => {
  await send(ctx, ctx.path, { root: __dirname + '/www' })
})

app.listen(port, (err, address) => {
  if (err) throw err
  console.log(`koa listening on port ${port}`)
})
