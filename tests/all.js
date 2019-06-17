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

function startServer () {
  console.log('Starting reserve'.cyan)
  return new Promise(resolve => {
    const server = fork(path.join(__dirname, '../index.js'), [].slice.call(arguments))
    server.on('message', message => {
      console.log('reserve message'.yellow, message.gray)
      if (message === 'ready') {
        resolve(server)
      }
    })
  })
}

function stopServer (server) {
  server.kill('SIGINT')
}

async function all () {
  const now = new Date()
  let failed = false
  const server1 = await startServer('--config', 'http')
  location.origin = 'http://localhost:5000'
  try {
    await assertions()
  } catch (e) {
    failed = true
    console.error(e.toString())
  }
  stopServer(server1)
  console.log('Total time (ms): ', new Date() - now)
  if (failed) {
    console.error(`At least one test failed`.red)
    process.exit(-1)
  } else {
    console.error(`All tests succeeded`.green)
    process.exit(0)
  }
}

all()
