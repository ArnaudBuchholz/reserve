'use strict'

const EventEmitter = require('events')
const fs = require('fs')
const path = require('path')
const util = require('util')

const readdir = util.promisify(fs.readdir)

const handlers = {}

const handlersReady = readdir(path.join(__dirname, 'handlers'))
  .then(names => names
    .filter(name => name.endsWith('.js'))
    .map(name => path.basename(name, '.js'))
    .forEach(name => {
      handlers[name] = require(path.join(__dirname, 'handlers', name + '.js'))
    })
  )

function buildServer (configuration, requestHandler) {
  let protocol
  let server
  if (configuration.ssl) {
    configuration.protocol = 'https'
    server = https.createServer({
      key: fs.readFileSync(configuration.ssl.key),
      cert: fs.readFileSync(configuration.ssl.cert)
    }, requestHandler)
  } else {
    configuration.protocol = 'http'
    server = http.createServer(requestHandler)
  }
  return server
}

function requestHandler (request, response) {
  if (this.verbose) {
    console.log('SERVE'.magenta, `${request.method} ${request.url}`.gray)
  }
  if (this.mappings.every(mapping => {
    const match = mapping.match.exec(request.url)
    if (match) {
      request.mapping = mapping
      request.match = match
      let redirect
      let type
      if (types.every(member => {
        type = member
        redirect = mapping[member]
        return !redirect
      })) {
        error(request, response, { message: 'invalid mapping' })
        return false
      }
      if (typeof redirect == 'string') {
        for (let capturingGroupIndex = match.length; capturingGroupIndex > 0; --capturingGroupIndex) {
          redirect = redirect.replace(new RegExp(`\\$${capturingGroupIndex}`, 'g'), match[capturingGroupIndex])
        }
      }
      if (this.verbose) {
        console.log('SERVE'.magenta, `${request.url} => ${type} ${redirect}`.gray)
      }
      typeHandlers[type](request, response)
        .then(() => { /* document response */}, reason => error(request, response, reason))
      return false
    }
    return true
  })) {
    error(request, response, { message: 'not mapped' })
  }
}

module.exports = configuration => {
  const eventEmitter = new EventEmitter
  handlersReady
    .then(() => validate(configuration))
    .then(() => new Promise((resolve, reject) => {
      buildServer(configuration, requestHandler)
        .listen(configuration.port, configuration.hostname, err => err? reject(err) : resolve())
    })
    .then(() => {
      console.log(`Server running at ${configuration.protocol}://${configuration.hostname}:${configuration.port}/`.yellow)
      eventEmitter.emit('ready')
    })
    .catch(reason => eventEmitter.emit('error', reason))
  return eventEmitter
}
