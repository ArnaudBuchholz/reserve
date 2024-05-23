const fastify = require('fastify')()
const { join } = require('path')
const { FASTIFY_PORT: PORT } = require('./ports.js')

fastify.register(require('@fastify/static'), {
  root: join(__dirname, 'www')
})

fastify.get('/hello', function (req, reply) {
  reply.send('Hello World !')
})

fastify.listen({ port: PORT }, (err, address) => {
  if (err) throw err
  console.log(`fastify listening on port ${PORT}`)
})
