'use strict'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

require('colors')
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
  console.log('Starting reserve'.cyan)
  console.log(`directory:  ${process.cwd()}`.gray)
  console.log(`parameters: ${cmdLineParameters.join(' ')}`.gray)
  return new Promise(resolve => {
    const server = fork(path.join(__dirname, '../index.js'), cmdLineParameters)
    server.on('message', message => {
      console.log('reserve message'.yellow, message.gray)
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
    console.error(`All tests succeeded`.green)
  } catch (e) {
    console.error(e.toString().red)
  } finally {
    console.log('Total time (ms): ', new Date() - now)
  }
}

all()
