'use strict'

const { log, serve } = require('..')
const colors = require('../detect/colors')

function html (content, request, response) {
  response.writeHead(200, {
    'Content-Type': 'text/html',
    'Content-Legth': content.length
  })
  response.end(content)
}

log(serve({
  port: 8081,
  mappings: [{
    match: /^\/$/,
    custom: html.bind(null, `<!doctype html>
<html>
  <head>
    <title>Abort example</title>
  </head>
  <body>
    <button>Test</button>
    <script>
      const button = document.querySelector('button')
      let xhr
      button.addEventListener('click', function () {
        if (xhr) {
            xhr.abort()
            return
        }
        xhr = new XMLHttpRequest()
        xhr.open('GET', '/ajax')
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    alert('Got it')
                } else {
                    alert('Failed')
                }
                button.innerHTML = 'Test'
                xhr = null
            }
        };
        button.innerHTML = 'Abort'
        xhr.send()
      })
    </script>
  </body>
</html>`)
  }, {
    match: /^\/ajax/,
    custom: (request, response) => new Promise(resolve => {
      setTimeout(() => {
        response.writeHead(200, {
            'Content-Type': 'application/json'
          })
          response.end('true')
          resolve()
      }, 5000) // 5s
    })
  }]
}), true)
  .on('incoming', ({ method, url }) => {
    console.log(colors.gray('INCMG'), colors.gray(method), colors.gray(url))
  })
  .on('closed', ({ method, url }) => {
    console.log(colors.magenta('CLOSE'), colors.gray(method), colors.gray(url))
  })
