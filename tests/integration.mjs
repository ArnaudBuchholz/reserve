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

async function test (config, base) {
  const server = await start(config)

  async function match (url, expected) {
    const response = await got(base + url, {
      throwHttpErrors: false
    })
    const extracted = {}
    Object.keys(expected)
      .filter(member => !['body'].includes(member))
      .forEach(member => {
        if (member === 'headers') {
          extracted.headers = {}
          Object.keys(expected.headers).forEach(header => { extracted.headers[header] = response.headers[header] })
        } else {
          extracted[member] = response[member]
        }
      })
    if (expected.body) {
      if (typeof expected.body === 'object') {
        extracted.body = JSON.parse(response.body)
      } else if (typeof expected.body === 'function') {
        await expected.body(response.body)
        delete expected.body
      } else {
        extracted.body = response.body
      }
    }
    assert.deepStrictEqual(extracted, expected, url)
  }

  await match('/file/mappings.json', {
    statusCode: 200,
    body: async body => {
      const file = JSON.parse(body)
      assert.strictEqual(typeof file.mappings, 'object')
    }
  })
  await match('/file/Hello World.txt', {
    statusCode: 200,
    headers: {
      'content-type': 'text/plain',
      'content-length': '13'
    },
    body: 'Hello World!\n'
  })
  await match('/file/hello world.txt', {
    statusCode: 404,
    body: 'Not found'
  })

  // URL
  // proxy
  const proxifiedJs = await got(base + '/proxy/https/arnaudbuchholz.github.io/blog/jsfiddle-assert.js').text()
  assert.strictEqual(proxifiedJs.includes('return document.body.appendChild(line);'), true)

  await failWith404(base + '/status/404')


  await server.close()
}

await test('tests/http.json', 'http://localhost:5000')
