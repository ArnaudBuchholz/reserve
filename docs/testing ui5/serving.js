'use strict'

const job = {
  cwd: process.cwd(),
  port: 0,
  ui5: 'https://ui5.sap.com/1.87.0',
  webapp: 'webapp',
  logServer: false
}

process.argv.forEach(arg => {
  const valueParsers = {
    boolean: value => value === 'true',
    number: value => parseInt(value, 10),
    default: value => value
  }

  const parsed = /-(\w+):(.*)/.exec(arg)
  if (parsed) {
    const [, name, value] = parsed
    if (Object.prototype.hasOwnProperty.call(job, name)) {
      const valueParser = valueParsers[typeof job[name]] || valueParsers.default
      job[name] = valueParser(value)
    }
  }
})

const { isAbsolute, join } = require('path')

function toAbsolute (member, from = job.cwd) {
  if (!isAbsolute(job[member])) {
    job[member] = join(from, job[member])
  }
}

toAbsolute('cwd', process.cwd())
toAbsolute('webapp')

const ui5 = [{
  // UI5 from url
  method: ['GET', 'HEAD'],
  match: /\/((?:test-)?resources\/.*)/,
  url: `${job.ui5}/$1`
}]
const { check, log, serve } = require('reserve')

async function main () {
  const configuration = await check({
    port: job.port,
    mappings: [
      ...ui5, {
        // Project mapping
        match: /^\/(.*)/,
        file: join(job.webapp, '$1')
      }]
  })
  const server = serve(configuration)
  if (job.logServer) {
    log(server)
  }
  server
    .on('ready', async ({ url, port }) => {
      job.port = port
      if (!job.logServer) {
        console.log(`Server running at ${url}`)
      }
    })
}

main()
