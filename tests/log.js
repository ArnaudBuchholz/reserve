'use strict'

const { log } = require('..')
const { EventEmitter } = require('./dependencies')
const emitter = new EventEmitter()
log(emitter, process.argv.includes('-verbose'))

emitter.emit('incoming', {
  id: 3475,
  method: 'GET',
  url: '/index.html',
  start: new Date()
})

emitter.emit('redirecting', {
  id: 3475,
  method: 'GET',
  url: '/index.html',
  start: new Date(),
  type: 'custom',
  redirect: '/index.html'
})

emitter.emit('error', {
  id: 3475,
  method: 'GET',
  url: '/index.html',
  start: new Date(),
  reason: 'Not able to process'
})
