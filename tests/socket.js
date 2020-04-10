'use strict'

const path = require('path')
const { serve } = require('..')

function socket (eventEmitter) {
  eventEmitter.on('server-created', ({ server }) => {
    console.log('server-created')
    socket.io = require('socket.io')(server)
  })
}

serve({
  port: 8081,
  plugins: [socket],
  mappings: [{
    match: /^\/(.*)/,
    file: path.join(__dirname, '$1')
  }]
})
  .on('ready', ({ url }) => {
    console.log(`Server running at ${url}`)
  })
