'use strict'

const autocannon = require('autocannon')
const ports = require('./ports.js')

async function test (name, url) {
  for (const portName of Object.keys(ports)) {
    const port = ports[portName]
    const impl = /^(.*)_PORT/.exec(portName)[1].toLocaleLowerCase()
    for (let measure = 0; measure < 3; ++measure) {
      const result = await autocannon({ url: `http://localhost:${port}${url}` })
      if (result.non2xx !== 0) {
        throw new Error(`Non 2xx results on ${name} for ${impl}`)
      }
      console.log([name, impl, result['2xx']].join(','))
    }
  }
}

async function main () {
  await test('hello world', '/hello')
  await test('index.html', '/index.html')
}

main()
