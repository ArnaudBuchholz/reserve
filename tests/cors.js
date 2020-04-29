// Based on https://en.wikipedia.org/wiki/Cross-origin_resource_sharing

'use strict'

function html (content, request, response) {
  response.writeHead(200, {
    'Content-Type': 'text/html',
    'Content-Legth': content.length
  })
  response.end(content)
}

if (require.main === module) {
  const { serve } = require('..')

  serve({
    port: 5002,
    mappings: [{
      match: /^\/$/,
      custom: html.bind(null, `<!doctype html>
    <html>
      <script>
    function request (method, url, { headers = {}, async = true, data = null } = {}) {
      console.log(method, url, headers, async)
      return new Promise(resolve => {
        const xhr = new XMLHttpRequest()
        xhr.open(method, url, async)
        Object.keys(headers).forEach(name => xhr.setRequestHeader(name, headers[name]))
        xhr.onload = () => {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              console.log(xhr.responseText)
              resolve()
            } else {
              console.error(xhr.statusText)
              resolve()
            }
          }
        };
        xhr.onerror = function (e) {
          console.error(xhr.statusText)
          resolve()
        };
        xhr.send(data)
      })
    }

    async function test () {
      await request('GET', 'http://localhost:5000/mappings.json')
      await request('GET', 'http://localhost:5000/mappings.json', {
        headers: {
          'x-custom-header': 'Hello World !'
        }
      })
      await request('POST', 'http://localhost:5000/echo/hello')
    }
      </script>
      <body onload="test()">
        Please open the console...
      </body>
    </html>`)
    }]
  })
    .on('ready', ({ url }) => {
      console.log(`Run the http.json configuration and then connect to ${url}`)
    })
} else {
  module.exports = (request, response) => {
    if (request.method === 'OPTIONS') {
      response.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*'
      })
      response.end()
    } else {
      response.setHeader('Access-Control-Allow-Origin', '*')
    }
  }
}
