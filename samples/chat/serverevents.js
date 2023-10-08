'use strict'

const { body, serve } = require('../..') // use require('reserve')
const EventEmitter = require('events')

function html (content, request, response) {
  response.writeHead(200, {
    'Content-Type': 'text/html',
    'Content-Legth': content.length
  })
  response.end(content)
}

class Channel extends EventEmitter {
  constructor () {
    super()
    this.messages = ['Welcome to the chat.']
  }

  publish (message) {
    const id = this.messages.length
    this.messages.push(message)
    this.emit('message', { id, message })
  }
}
const channel = new Channel()

serve({
  port: 8081,
  mappings: [{
    match: /favicon\.ico/,
    file: 'favicon.ico'
  }, {
    match: /^\/$/,
    custom: html.bind(null, `<!doctype html>
<html>
  <head>
    <title>Server Events chat</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font: 13px Helvetica, Arial; }
      form { background: #000; padding: 3px; position: fixed; bottom: 0; width: 100%; }
      form input { border: 0; padding: 10px; width: 90%; margin-right: .5%; }
      form button { width: 9%; background: rgb(130, 224, 255); border: none; padding: 10px; }
      #messages { list-style-type: none; margin: 0; padding: 0; }
      #messages li { padding: 5px 10px; }
      #messages li:nth-child(odd) { background: #eee; }
      #messages { margin-bottom: 40px }
    </style>
  </head>
  <body>
    <ul id="messages"></ul>
    <form action="">
      <input id="m" autocomplete="off" /><button>Send</button>
    </form>
    <script src="https://code.jquery.com/jquery-1.11.1.js"></script>
    <script>
      const eventSource = new EventSource('/chat/listener')

      eventSource.addEventListener('message', e => {
        $('#messages').append($('<li>').text(e.data))
        window.scrollTo(0, document.body.scrollHeight)
      })

      $('form').submit(() => {
        const body = $('#m').val()
        $('#m').val('')
        fetch('/chat/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
            'Content-Length': body.length
          },
          body
        })
        return false
      })
    </script>
  </body>
</html>`)
  }, {
    match: '/chat/listener',
    custom: (request, response) => {
      response.writeHead(200, {
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache'
      })

      const lastId = parseInt(request.headers['Last-Event-ID'] || '-1')
      channel.messages.forEach((message, id) => {
        if (id > lastId) {
          response.write(`event: message\nid: ${id}\ndata: ${message}\n\n`)
        }
      })

      const listener = function ({ id, message }) {
        this.write(`event: message\nid: ${id}\ndata: ${message}\n\n`)
      }.bind(response)

      channel.on('message', listener)

      // REserve expects a promise, sync with request closing
      let resolver
      const promise = new Promise(resolve => {
        resolver = resolve
      })
      request.on('close', () => {
        channel.off('message', listener)
        try {
          response.end()
        } finally {
          resolver()
        }
      })
      return promise
    }
  }, {
    match: '/chat/message',
    custom: async (request, response) => {
      channel.publish(await body(request))
      response.writeHead(200)
      response.end()
    }
  }]
})
  .on('ready', ({ url }) => {
    console.log(`Server running at ${url}`)
  })
