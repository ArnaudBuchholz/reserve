import { serve } from 'reserve'
import http from 'http'

let baseUrl

async function request (url, headers = {}) {
  const response = await new Promise((resolve, reject) => {
    const parsed = new URL(url, baseUrl)
    const { hostname, port, pathname, search, hash } = parsed
    const path = `${pathname}${search}${hash}`
    const request = http.request({
      method: 'GET',
      hostname,
      port,
      path,
      headers
    }, resolve)
    request.on('error', e => reject(e))
    request.end()
  })
  await new Promise(resolve => {
    const body = []
    response.on('data', chunk => body.push(chunk.toString()))
    response.on('end', () => {
      response.body = body.join('')
      resolve()
    })
  })
  return response
}

async function main () {
  const server = serve({
    port: 5000,
    mappings: [{
      match: '/non-closable',
      custom: async (req, res) => {
        // Simulate a non-closable resource by not ending the response
        res.writeHead(200, { 'Content-Type': 'text/plain' })
        res.write('This resource will not close properly.')
        // Do not call res.end()
        return new Promise(() => {})
      }
    }, {
      status: 404
    }]
  })
  const sockets = []
  let nextSocketId = 0
  server.on('created', ({ server: nativeServer }) => {
    nativeServer.on('connection', function (socket) {
      // Add a newly connected socket
      const socketId = nextSocketId++
      sockets[socketId] = socket
      console.log('socket', socketId, 'opened')

      // Remove the socket when it closes
      socket.on('close', function () {
        console.log('socket', socketId, 'closed')
        delete sockets[socketId]
      })

      // Extend socket lifetime for demo purposes
      socket.setTimeout(60000)
    })
  })
  await new Promise((resolve, reject) => {
    server.on('ready', ({ url }) => {
      baseUrl = url
      resolve()
    })
    server.on('error', reject)
  })

  const response = await request('test')
  console.log('Response status:', response.statusCode)
  request('non-closable')

  await server.close()
  const activeHandles = process._getActiveHandles()
  const activeRequests = process._getActiveRequests()
  if (activeHandles.length > 0 || activeRequests.length > 0) {
    console.error('There are still active handles or requests after closing the server.')
    console.error('Active Handles:', activeHandles.map(handle => handle.constructor.name))
    console.error('Active Requests:', activeRequests)
  }
  // https://stackoverflow.com/questions/14626636/how-do-i-shut-down-a-node-js-https-server-immediately
  console.log('Server closed, exiting...')
}

main()
