const fastify = require('fastify')()
const { join } = require('path')

fastify.register(require('@fastify/static'), {
  root: join(__dirname, 'www')
})

fastify.get('/', function (req, reply) {
  reply.sendFile('index.html')
})

fastify.listen({ port: 8082 }, (err, address) => {
  if (err) throw err
  console.log(`Listening on port 8082`)
})
