'use strict'

const { body } = require('reserve')

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
    this.plots = require('./plots')
    this.plots.on('plot', ({ id, plot }) => {
      this.channels.forEach(channel => send(channel, id, plot))
    })
  }

  if (request.method === 'POST') {
    this.plots.push(await body(request))
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
  this.plots.forEach(lastId + 1, ({ id, plot }) => send(response, id, plot))

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
}
