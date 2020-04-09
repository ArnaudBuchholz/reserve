'use strict'

const { serve } = require('..')

let count = 0

serve({
  port: 8080,
  mappings: [{
    match: /favicon\.ico/,
    status: 404
  }, {
    custom: (request, response) => {
      ++count
      const cookies = request.headers.cookie.split(';')
      const html = `<html>
  <body>
    ${cookies.join('<br />')}
  </body>
</html>`
      response.writeHead(200, {
        'Content-Type': 'text/html',
        'Content-Length': html.length,
        'Set-Cookie': `count=${count}`
      })
      response.end(html)
    }
  }]
})
  .on('ready', ({ url }) => {
    console.log(`Server running at ${url}`)
  })
