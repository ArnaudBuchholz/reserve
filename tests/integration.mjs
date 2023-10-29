import got from 'got'
import { fork } from 'child_process'
import assert from 'assert'

const mode = process.argv[2] ?? 'cli'

async function start (config) {
  if (mode === 'cli' || mode === 'dist') {
    const commands = {
      cli: './src/cli.js',
      dist: './dist/cli.js'
    }
    return new Promise(resolve => {
      const server = fork(commands[mode], ['--config', config])
      server.on('message', message => {
        if (message === 'ready') {
          resolve(server)
        }
      })
      server.close = () => {
        server.kill('SIGINT')
      }
    })
  } else {
    const { read, serve } = await import('../dist/index.mjs')
    return read(config)
      .then(configuration => {
        const server = serve(configuration)
        return new Promise(resolve => {
          server.on('ready', () => resolve(server))
        })
      })
  }
}

async function test (config, base) {
  const server = await start(config)
  // mappings.json (file mapping)
  const mappings = await got(base + '/mappings.json').json()
  assert.strictEqual(typeof mappings.mappings, 'object')
  await server.close()
}

await test('tests/http.json', 'http://localhost:5000')
