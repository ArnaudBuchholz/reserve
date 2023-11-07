import { fork } from 'child_process'
import assert from 'assert'
import http from 'http'
import { URL } from 'url'

const mode = process.argv[2] || 'cli'

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
  } else if (mode === 'mock') {
    const { read, mock, log } = await import('../dist/index.mjs')
    return read(config)
      .then(configuration => {
        const server = log(mock(configuration))
        return new Promise(resolve => {
          server.on('ready', () => resolve(server))
        })
      })
  } else if (mode === 'mjs') {
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
  const now = Date.now()

  async function match (req, expected) {
    let { method = 'GET', url, headers = {}, data } = req
    if (typeof req === 'string') {
      url = req
    }
    let response
    if (mode === 'mock') {
      response = await server.request(method, url, headers, data)
        .then(async response => {
          await response.waitForFinish
          response.body = response.toString()
          return response
        })
    } else {
      response = await new Promise((resolve, reject) => {
        const parsed = new URL(url, base)
        const { hostname, port, pathname, search, hash } = parsed
        const path = `${pathname}${search}${hash}`
        const request = http.request({
          method,
          hostname,
          port,
          path,
          headers
        }, response => {
          const body = []
          response.on('data', chunk => body.push(chunk.toString()))
          response.on('end', () => {
            response.body = body.join('')
            resolve(response)
          })
        })
        request.on('error', e => reject(e))
        if (data) {
          request.write(data)
        }
        request.end()
      })
    }
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
    assert.deepStrictEqual(extracted, expected, `${method} ${url}`)
    return response
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
      'content-length': '13',
      'cache-control': 'no-store',
      'accept-ranges': 'bytes'
    },
    body: 'Hello World!\n'
  })
  await match({
    url: '/file/Hello World.txt',
    headers: {
      range: 'bytes=6-10'
    }
  }, {
    statusCode: 206,
    headers: {
      'content-type': 'text/plain',
      'content-length': '5',
      'content-range': 'bytes 6-10/13'
    },
    body: 'World'
  })
  await match({
    url: '/file/Hello World.txt',
    headers: {
      range: 'bytes=6-'
    }
  }, {
    statusCode: 206,
    headers: {
      'content-type': 'text/plain',
      'content-length': '7',
      'content-range': 'bytes 6-12/13'
    },
    body: 'World!\n'
  })
  await match({
    url: '/file/Hello World.txt',
    headers: {
      range: 'bytes=99-'
    }
  }, {
    statusCode: 416,
    headers: {
      'content-type': 'text/plain',
      'content-length': '0'
    }
  })
  await match('/file/hello world.txt', {
    statusCode: 501,
    body: 'Not Implemented'
  })
  await match('/file/mime/Hello World.txt', {
    statusCode: 200,
    headers: {
      'content-type': 'application/x-httpd-php',
      'content-length': '13'
    },
    body: 'Hello World!\n'
  })
  const { headers: { 'last-modified': lastModified } } = await match('/file/cache/modified/Hello World.txt', {
    statusCode: 200,
    headers: {
      'cache-control': 'no-cache'
    },
    body: 'Hello World!\n'
  })
  await match({
    url: '/file/cache/modified/Hello World.txt',
    headers: {
      'if-modified-since': lastModified
    }
  }, {
    statusCode: 304,
    headers: {
      'cache-control': 'no-cache'
    }
  })
  await match({
    url: '/file/cache/modified/Hello World.txt',
    headers: {
      'if-range': lastModified,
      range: 'bytes=6-10'
    }
  }, {
    statusCode: 206,
    headers: {
      'content-type': 'text/plain',
      'content-length': '5',
      'content-range': 'bytes 6-10/13'
    },
    body: 'World'
  })
  await match({
    url: '/file/cache/modified/Hello World.txt',
    headers: {
      'if-range': Date.now(),
      range: 'bytes=6-10'
    }
  }, {
    statusCode: 200,
    headers: {
      'content-type': 'text/plain',
      'content-length': '13'
    },
    body: 'Hello World!\n'
  })
  await match('/file/cache/max-age/Hello World.txt', {
    statusCode: 200,
    headers: {
      'cache-control': 'public, max-age=360, immutable'
    },
    body: 'Hello World!\n'
  })
  await match('/file/status/Hello World.txt', {
    statusCode: 205,
    body: 'Hello World!\n'
  })

  await match('/url/proxy/https/arnaudbuchholz.github.io/blog/jsfiddle-assert.js', {
    statusCode: 200,
    body: async body => assert.match(body, /return document.body.appendChild\(line\);/)
  })

  await match('/url/badssl', {
    statusCode: 200,
    body: async body => assert.match(body, /badssl\.com/)
  })

  await match('/custom/echo/Hello World !', {
    statusCode: 200,
    headers: {
      'content-type': 'text/plain',
      'content-length': '17'
    },
    body: 'Hello%20World%20!'
  })
  await match({
    method: 'POST',
    url: '/custom/echo',
    data: 'Hello World !'
  }, {
    statusCode: 200,
    headers: {
      'content-type': 'text/plain',
      'content-length': '13'
    },
    body: 'Hello World !'
  })
  await match('/custom/configuration', {
    statusCode: 200
  })

  await match('/status/301', {
    statusCode: 301,
    headers: {
      location: 'https://www.npmjs.com/package/reserve'
    }
  })
  await match(`/status/redirect/${now}`, {
    statusCode: 302,
    headers: {
      location: `https://www.npmjs.com/package/${now}`
    }
  })
  await match('/status/404', {
    statusCode: 404,
    body: 'Not found'
  })
  await match('/status/508', {
    statusCode: 508,
    body: 'Loop Detected'
  })

  await match({ method: 'OPTIONS', url: '/file/Hello World.txt' }, {
    statusCode: 204,
    headers: {
      'access-control-allow-origin': 'http://example.com',
      'access-control-allow-methods': 'GET,POST'
    }
  })
  await match({ method: 'GET', url: '/file/Hello World.txt' }, {
    statusCode: 200,
    headers: {
      'access-control-allow-origin': 'http://example.com'
    }
  })

  await server.close()
}

async function main () {
  await test('tests/http.json', 'http://localhost:5000')
}

main()
