import { log, send, serve } from 'reserve'
log(serve({
  port: 8080,
  mappings: [{
    custom: (req, res) => send(res, 'Hello World !')
  }]
}))
