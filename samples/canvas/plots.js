'use strict'

const { body } = require('../..')

const send = function (channel, id, plot) {
  try {
    channel.write(`event: plot\nid: ${id}\ndata: ${plot}\n\n`)
  } catch (e) {
    // ignore
  }
}

module.exports = async function (request, response) {
  if (!this.plots) {
    this.channels = []
    this.plots = []
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

  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache'
  }
  if (!this.configuration.http2) {
    headers.Connection = 'keep-alive'
  }
  response.writeHead(200, headers)

  const lastId = parseInt(request.headers['Last-Event-ID'] || '-1')
  this.plots.slice(lastId + 1).forEach((plot, id) => send(response, id, plot))

  this.channels.push(response)

  let resolver
  const promise = new Promise(resolve => {
    resolver = resolve
  })
  const close = () => {
    this.channels = this.channels.filter(channel => channel !== response)
    try {
      response.end()
    } finally {
      resolver()
    }
  }
  request.on('close', close)
  request.on('abort', close)
  return promise
}.bind({})
