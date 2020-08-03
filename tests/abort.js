'use strict'

const { log, serve } = require('..')

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
    <button>Test</button><br>
    open the console
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
                    console.log('Got it')
                } else {
                    console.log('Failed')
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
}), process.argv.includes('--verbose'))
