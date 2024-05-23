const { join } = require('path')
let reserve
if (process.argv.includes('--source')) {
  reserve = require(join(__dirname, '../../reserve/src/'))
} else {
  reserve = require('reserve')
}
const { serve, send } = reserve
const { RESERVE_PORT: PORT } = require('./ports.js')
const v8 = require('v8')

serve({
  cwd: __dirname,
  port: PORT,
  mappings: [{
    match: '/healthcheck',
    custom: (_, response) => send(response, {
      memory: process.memoryUsage(),
      v8Heap: v8.getHeapStatistics()
    })
  }, {
    match: '/hello',
    custom: async (request, response) => {
      await send(response, 'Hello World !')
    }
  }, {
    file: './www/$1'
  }, {
    status: 404
  }]
})
  .on('ready', ({ port }) => {
    console.log(`REserve listening on port ${port}`)
  })
