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
    const { read, serve, log } = await import('../dist/index.mjs')
    return read(config)
      .then(configuration => {
        const server = log(serve(configuration))
        return new Promise(resolve => {
          server.on('ready', () => resolve(server))
        })
      })
  }
}

async function failWith404 (url) {
  let exceptionCaught
  try {
    await got(url)
  } catch (e) {
    exceptionCaught = e
  }
  assert.strictEqual(exceptionCaught.response.statusCode, 404)
}

async function test (config, base) {
  const server = await start(config)
  // FILE
  // mappings.json
  const mappings = await got(base + '/mappings.json').json()
  assert.strictEqual(typeof mappings.mappings, 'object')
  // Hello World.txt (case sensitive)
  const helloWorld = await got(base + '/Hello World.txt').text()
  assert.strictEqual(helloWorld, 'Hello World!\n')
  await failWith404(base + '/hello world.txt')
  // URL
  // proxy
  const proxifiedJs = await got(base + '/proxy/https/arnaudbuchholz.github.io/blog/jsfiddle-assert.js').text()
  assert.strictEqual(proxifiedJs.includes('return document.body.appendChild(line);'), true)
  await server.close()
}

await test('tests/http.json', 'http://localhost:5000')
