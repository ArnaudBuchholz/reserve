'use strict'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

global.gpf = require('gpf-js')
global.assert = require('assert')
global.location = {
  origin: ''
}
/* global location */
const assertions = require('./assertions')
const path = require('path')
const { fork } = require('child_process')

function startServer (cmdLineParameters) {
  console.log('Starting reserve')
  console.log(`directory:  ${process.cwd()}`)
  console.log(`parameters: ${cmdLineParameters.join(' ')}`)
  return new Promise(resolve => {
    const server = fork(path.join(__dirname, '../src/cli.js'), cmdLineParameters)
    server.on('message', message => {
      console.log('reserve message', message)
      if (message === 'ready') {
        resolve(server)
      }
    })
  })
}

async function testServer (origin, ...cmdLineParameters) {
  const server = await startServer(cmdLineParameters)
  location.origin = origin
  try {
    await assertions()
  } finally {
    server.kill('SIGINT')
  }
}

async function all () {
  const now = new Date()
  try {
    process.chdir('./tests')
    await testServer('http://localhost:5000', '--config', 'http.json')
    await testServer('https://localhost:5001', '--config', 'https.json')
    process.chdir('./sub')
    await testServer('http://localhost:5002')
    console.error('All tests succeeded')
  } catch (e) {
    console.error(e.toString())
  } finally {
    console.log('Total time (ms): ', new Date() - now)
  }
}

all()
