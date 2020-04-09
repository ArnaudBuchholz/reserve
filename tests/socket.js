'use strict'

const path = require('path')
const { serve } = require('..')
serve({
  port: 8081,
  plugins: [{
    alterHttpServer: function (server) {
      this.io = require('socket.io')(server)
    }
  }],
  mappings: [{
    match: /^\/(.*)/,
    file: path.join(__dirname, '$1')
  }]
})
  .on('ready', ({ url }) => {
    console.log(`Server running at ${url}`)
  })
