'use strict'

const { body, serve } = require('..')

function html (content, request, response) {
  response.writeHead(200, {
    'Content-Type': 'text/html',
    'Content-Legth': content.length
  })
  response.end(content)
}

serve({
  port: 8082,
  mappings: [{
    match: /^\/$/,
    methods: 'GET',
    custom: html.bind(null, `<!doctype html>
<html>
  <head>
    <title>Draw !</title>
    <style>
html, body {
  width:  100%;
  height: 100%;
  margin: 0;
}    
    </style>
  </head>
  <body>
    <canvas></canvas>
  </body>
  <script>
    const canvas = document.querySelector('canvas')
    const context = canvas.getContext("2d")
    function resize () {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)
    resize()
    let draw = false
    canvas.addEventListener('mousemove', event => {
      const { clientX, clientY } = event
      const body = [clientX, clientY].join(',')
      if (draw) {
        fetch('/plots', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
            'Content-Length': body.length
          },
          body
        })
      }
    })
    canvas.addEventListener('mousedown', event => {
      draw = true
    })
    canvas.addEventListener('mouseup', event => {
      draw = false
    })
    function plot(x, y) {
      context.beginPath()
      context.arc(x, y, 10, 0, 2 * Math.PI)
      context.stroke()
    }
    const plotsSource = new EventSource('/plots')
    plotsSource.addEventListener('plot', e => {
      const [rawX, rawY] = e.data.split(',')
      plot(parseInt(rawX, 10), parseInt(rawY, 10))
    })
  </script>
</html>`)
  }, {
    match: '/display',
    methods: 'GET',
    custom: html.bind(null, `
<html>
  <head>
    <title>Display</title>
    <script>
      const count = parseInt((location.search.match(/count=(\\d+)/) || [,4])[1])
      const header = parseInt((location.search.match(/header=(\\d+)/) || [,0])[1])
      const cols = Math.ceil(Math.sqrt(count))
      const rows = Math.ceil(count / cols)
      const features = {
        height: Math.floor(screen.height / rows) - header,
        location: 0,
        menubar: 0,
        resizable: 0,
        status: 0,
        toolbar: 0,
        width: Math.floor(screen.width / cols)
      }
      const windows = []
      let index = 0
      while (index < count) {
        const windowFeatures = Object.keys(features)
          .map(name => name + '=' + features[name].toString())
          .concat('left=' + (index % cols) * features.width)
          .concat('top=' + Math.floor(index / cols) * (features.height + header))
          .join(',')
          windows.push(window.open('http://localhost:8082', '_blank', windowFeatures))
        ++index
      }
    </script>
  </head>
  <body>
      <button>close</button>
      <script>
        document.querySelector('button').addEventListener('click', () => windows.forEach(wnd => wnd.close()))
      </script>
  </body>
</html>`)
  }, {
    match: '/plots',
    methods: ['POST', 'GET'],
    custom: async function (request, response) {
      if (!this.plots) {
        this.channels = []
        this.plots = []
      }
      const send = function (channel, id, plot) {
        try {
          channel.write(`event: plot\nid: ${id}\ndata: ${plot}\n\n`)
        } catch (e) {
          // ignore
        }
      }
      if (request.method === 'POST') {
        const plot = await body(request)
        this.plots.push(plot)
        const id = this.plots.length
        this.channels.forEach(channel => send(channel, id, plot))
        response.writeHead(200, {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
          'Content-Length': 0
        })
        response.end()
        return
      }
      response.writeHead(200, {
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache'
      })
      const lastId = parseInt(request.headers['Last-Event-ID'] || '-1')
      this.plots.slice(lastId + 1).forEach((plot, id) => send(response, id, plot))
      this.channels.push(response)
      let resolver
      const promise = new Promise(resolve => {
        resolver = resolve
      })
      const close = () => {
        this.channels = this.channels.filter(channel => channel !== response)
        resolver()
      }
      request.on('close', close)
      request.on('abort', close)
      return promise
    }.bind({})
  }, {
    status: 501
  }]
})
  .on('ready', ({ url }) => {
    console.log(`Server running at ${url}`)
  })
