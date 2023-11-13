import { check, serve } from 'reserve'

check({
  port: 8080,
  mappings: [{
    match: /^\/(.*)/,
    file: '$1'
  }]
})
  .then(configuration => {
    serve(configuration)
      .on('ready', ({ url }) => {
        console.log(`Server running at ${url}`)
      })
  })
