const fastify = require('fastify')()
const { join } = require('path')
const port = 8082

fastify.register(require('@fastify/static'), {
  root: join(__dirname, 'www')
})

fastify.get('/', function (req, reply) {
  reply.sendFile('index.html')
})

fastify.listen({ port }, (err, address) => {
  if (err) throw err
  console.log(`Listening on port ${port}`)
})
