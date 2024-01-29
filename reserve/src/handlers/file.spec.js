'use strict'

const { describe, it, before, after } = require('mocha')
const assert = require('assert')
const { notExpected, wrapHandler } = require('test-tools')
const fileHandler = require('./file')
const handle = wrapHandler(fileHandler, { mapping: { cwd: '/' } })
const fs = require('fs')
const { promisify } = require('util')
const mockRequire = require('mock-require')
const Response = require('../mock/Response')
const { $fileCache } = require('../symbols')
const Request = require('../mock/Request')

const textMimeType = 'text/plain'
const htmlMimeType = 'text/html'
const defaultMimeType = 'application/octet-stream'

const ignored = ({ redirected, response }) => redirected.then(value => {
  assert.strictEqual(value, undefined)
  assert.ok(response.isInitial())
})

describe('handlers/file', () => {
  it('returns a promise', () => handle('./file.txt')
    .then(({ redirected }) => {
      assert.strictEqual(typeof redirected.then, 'function')
    })
  )

  it('pipes file content', () => handle({
    request: './file.txt'
  })
    .then(({ redirected, response }) => redirected.then(value => {
      assert.strictEqual(value, undefined)
      assert.strictEqual(response.statusCode, 200)
      assert.strictEqual(response.headers['Content-Type'], textMimeType)
      assert.strictEqual(response.toString(), 'Hello World!')
    }))
  )

  it('forbids access to parent path (../)', async () => {
    const request = new Request({ method: 'GET', url: 'anything' })
    request.setForgedUrl('../file.txt')
    await handle({
      request,
      mapping: {
        cwd: '/folder'
      }
    })
      .then(ignored)
  })

  it('forbids access to parent path (%2E%2E/)', async () => {
    const request = new Request({ method: 'GET', url: 'anything' })
    request.setForgedUrl('%2E%2E/file.txt')
    await handle({
      request,
      mapping: {
        cwd: '/folder'
      }
    })
      .then(ignored)
  })

  it('uses statusCode if changed before', () => {
    const response = new Response()
    response.statusCode = 201
    return handle({
      request: '/file.txt',
      response
    })
      .then(({ redirected, response }) => redirected.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 201)
        assert.strictEqual(response.headers['Content-Type'], textMimeType)
        assert.strictEqual(response.toString(), 'Hello World!')
      }))
  })

  it('pipes file content (trim parameters)', () => handle({
    request: '/file.txt?param=1#hash'
  })
    .then(({ redirected, response }) => redirected.then(value => {
      assert.strictEqual(value, undefined)
      assert.strictEqual(response.statusCode, 200)
      assert.strictEqual(response.headers['Content-Type'], textMimeType)
      assert.strictEqual(response.toString(), 'Hello World!')
    }))
  )

  it('checks file access (url must *not* end with /)', () => handle({
    request: './file.txt/'
  })
    .then(ignored)
  )

  it('checks folder access (url must end with /)', () => handle({
    request: './folder'
  })
    .then(ignored)
  )

  it('sends index.html if accessing a folder', () => handle({
    request: './folder/'
  })
    .then(({ redirected, response }) => redirected.then(value => {
      assert.strictEqual(value, undefined)
      assert.strictEqual(response.statusCode, 200)
      assert.strictEqual(response.headers['Content-Type'], htmlMimeType)
      assert.strictEqual(response.headers['Content-Length'], '8')
      assert.strictEqual(response.toString(), '<html />')
    }))
  )

  it('sends index.html if accessing a folder (HEAD)', () => handle({
    request: {
      method: 'HEAD',
      url: './folder/'
    }
  })
    .then(({ redirected, response }) => redirected.then(value => {
      assert.strictEqual(value, undefined)
      assert.strictEqual(response.statusCode, 200)
      assert.strictEqual(response.headers['Content-Type'], htmlMimeType)
      assert.strictEqual(response.headers['Content-Length'], '8')
      assert.strictEqual(response.toString(), '')
    }))
  )

  it('defaults mimetype when no extension', () => handle({
    request: './file'
  })
    .then(({ redirected, response }) => redirected.then(value => {
      assert.strictEqual(value, undefined)
      assert.strictEqual(response.statusCode, 200)
      assert.strictEqual(response.headers['Content-Type'], defaultMimeType)
      assert.strictEqual(response.toString(), 'binary')
    }))
  )

  it('returns nothing if the file does not exist', () => handle({
    request: './not-found'
  })
    .then(ignored)
  )

  it('returns nothing if the folder does not exist', () => handle({
    request: './not-a-folder/not-found'
  })
    .then(ignored)
  )

  it('returns nothing if the folder does not have index.html', () => handle({
    request: './no-index/'
  })
    .then(ignored)
  )

  it('returns nothing if the folder contains a sub folder named index.html', () => handle({
    request: './wrong-index/'
  })
    .then(ignored)
  )

  describe('Case insensitive file system', function () {
    before(() => {
      fs.setCaseSensitive(false)
    })

    it('does not send back the file even when the file name does not match case sensitively', () => handle({
      request: '/File.txt'
    })
      .then(ignored)
    )

    it('does not send back the file even when the file name does not match case sensitively (HEAD)', () => handle({
      request: {
        method: 'HEAD',
        url: '/File.txt'
      }
    })
      .then(ignored)
    )

    it('finds the file case sensitively when requested', () => handle({
      request: '/file.txt'
    })
      .then(({ redirected, response }) => redirected.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers['Content-Type'], textMimeType)
        assert.strictEqual(response.headers['Content-Length'], '12')
        assert.strictEqual(response.toString(), 'Hello World!')
      }))
    )

    it('finds the file case sensitively when requested (HEAD)', () => handle({
      request: {
        method: 'HEAD',
        url: '/file.txt'
      }
    })
      .then(({ redirected, response }) => redirected.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers['Content-Type'], textMimeType)
        assert.strictEqual(response.headers['Content-Length'], '12')
        assert.strictEqual(response.toString(), '')
      }))
    )

    it('does not send the file back when the file name does not match case sensitively (folder)', () => handle({
      request: '/Folder/index.html'
    })
      .then(ignored)
    )

    it('finds the file case sensitively when requested (folder)', () => handle({
      request: '/folder/index.html'
    })
      .then(({ redirected, response }) => redirected.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers['Content-Type'], htmlMimeType)
        assert.strictEqual(response.toString(), '<html />')
      }))
    )

    after(() => {
      fs.setCaseSensitive(true)
    })
  })

  describe('Strict mode', function () {
    describe('Empty folders are ignored', () => {
      const html = ({ redirected, response }) => redirected.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers['Content-Type'], htmlMimeType)
        assert.strictEqual(response.toString(), '<html />')
      })

      it('returns result even if the path includes empty folders', () => handle({
        request: '/folder///index.html'
      })
        .then(html)
      )

      it('returns result even if the path includes empty folders (root)', () => {
        const request = new Request({ method: 'GET', url: 'whatever' })
        request.setForgedUrl('///folder/index.html')
        return handle({
          request
        })
          .then(html)
      })

      it('returns result even if the path includes empty folders (folder)', () => handle({
        request: '/folder///'
      })
        .then(html)
      )

      it('finds the file when the path strictly matches', () => handle({
        request: '/folder/index.html'
      })
        .then(html)
      )
    })
  })

  describe('ignore-if-not-found (default)', function () {
    it('returns nothing if the file does not exist', () => handle({
      request: './not-found'
    })
      .then(ignored)
    )

    it('returns nothing if the folder does not exist', () => handle({
      request: './not-a-folder/not-found'
    })
      .then(ignored)
    )

    it('returns nothing for incorrect folder access (url must end with /)', () => handle({
      request: './folder'
    })
      .then(ignored)
    )

    it('returns nothing if the folder does not have index.html', () => handle({
      request: './no-index/'
    })
      .then(ignored)
    )
  })

  describe('custom file system', () => {
    const customFs = {
      stat: promisify(fs.stat),
      readdir: promisify(fs.readdir),
      createReadStream: (path, options) => Promise.resolve(fs.createReadStream(path, options))
    }

    it('allows external module', () => {
      mockRequire('/cfs.js', customFs)
      return handle({
        request: './file.txt',
        mapping: {
          'custom-file-system': '/cfs.js'
        }
      })
        .then(({ redirected, response }) => redirected.then(value => {
          assert.strictEqual(value, undefined)
          assert.strictEqual(response.statusCode, 200)
          assert.strictEqual(response.headers['Content-Type'], textMimeType)
          assert.strictEqual(response.toString(), 'Hello World!')
        }))
    })

    it('validates custom file system methods', () => handle({
      request: './file.txt',
      mapping: {
        'custom-file-system': {
          stat: 0,
          readdir: promisify(fs.readdir)
        }
      }
    })
      .then(notExpected, reason => {
        assert.ok(!!reason)
      })
    )
  })

  describe('range request', () => {
    it('supports range request', () => handle({
      request: './file.txt'
    })
      .then(({ redirected, response }) => redirected.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers['Accept-Ranges'], 'bytes')
        assert.strictEqual(response.headers['Content-Range'], undefined)
        assert.strictEqual(response.toString(), 'Hello World!')
      }))
    )

    it('does not support multipart range request', () => handle({
      request: {
        method: 'GET',
        url: './file.txt',
        headers: {
          Range: 'bytes=0-2,5-6'
        }
      }
    })
      .then(({ redirected, response }) => redirected.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers['Content-Type'], textMimeType)
        assert.strictEqual(response.toString(), 'Hello World!')
      }))
    )

    it('returns only the request bytes (start)', () => handle({
      request: {
        method: 'GET',
        url: './file.txt',
        headers: {
          range: 'bytes=0-4'
        }
      }
    })
      .then(({ redirected, response }) => redirected.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 206)
        assert.strictEqual(response.headers['Content-Type'], textMimeType)
        assert.strictEqual(response.headers['Content-Range'], 'bytes 0-4/12')
        assert.strictEqual(response.headers['Content-Length'], '5')
        assert.strictEqual(response.toString(), 'Hello')
      }))
    )

    it('returns only the request bytes (middle)', () => handle({
      request: {
        method: 'GET',
        url: './file.txt',
        headers: {
          range: 'bytes=6-10'
        }
      }
    })
      .then(({ redirected, response }) => redirected.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 206)
        assert.strictEqual(response.headers['Content-Type'], textMimeType)
        assert.strictEqual(response.headers['Content-Range'], 'bytes 6-10/12')
        assert.strictEqual(response.headers['Content-Length'], '5')
        assert.strictEqual(response.toString(), 'World')
      }))
    )

    it('returns only the request bytes (end)', () => handle({
      request: {
        method: 'GET',
        url: './file.txt',
        headers: {
          range: 'bytes=6-'
        }
      }
    })
      .then(({ redirected, response }) => redirected.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 206)
        assert.strictEqual(response.headers['Content-Type'], textMimeType)
        assert.strictEqual(response.headers['Content-Range'], 'bytes 6-11/12')
        assert.strictEqual(response.headers['Content-Length'], '6')
        assert.strictEqual(response.toString(), 'World!')
      }))
    )

    it('fails with invalid range (start over the file size)', () => handle({
      request: {
        method: 'GET',
        url: './file.txt',
        headers: {
          range: 'bytes=12-'
        }
      }
    })
      .then(({ redirected, response }) => redirected.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 416)
        assert.strictEqual(response.headers['Content-Type'], textMimeType)
        assert.strictEqual(response.headers['Content-Length'], '0')
        assert.strictEqual(response.toString(), '')
      }))
    )

    it('fails with invalid range (start over end)', () => handle({
      request: {
        method: 'GET',
        url: './file.txt',
        headers: {
          range: 'bytes=5-2'
        }
      }
    })
      .then(({ redirected, response }) => redirected.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 416)
        assert.strictEqual(response.headers['Content-Type'], textMimeType)
        assert.strictEqual(response.headers['Content-Length'], '0')
        assert.strictEqual(response.toString(), '')
      }))
    )

    it('supports \'modified\' caching strategy and \'If-Range\' (matching)', () => handle({
      request: {
        method: 'HEAD',
        url: './file.txt',
        headers: {
          range: 'bytes=6-'
        }
      },
      mapping: {
        'caching-strategy': 'modified'
      }
    })
      .then(({ redirected, response }) => redirected.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 206)
        const lastModified = response.headers['Last-Modified']
        assert.ok(!!lastModified)
        return handle({
          request: {
            method: 'GET',
            url: './file.txt',
            headers: {
              range: 'bytes=6-',
              'If-Range': lastModified
            }
          },
          mapping: {
            'caching-strategy': 'modified'
          }
        })
      }))
      .then(({ redirected, response }) => redirected.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 206)
        assert.strictEqual(response.headers['Content-Type'], textMimeType)
        assert.strictEqual(response.headers['Content-Range'], 'bytes 6-11/12')
        assert.strictEqual(response.headers['Content-Length'], '6')
        assert.strictEqual(response.toString(), 'World!')
      }))
    )

    it('supports \'modified\' caching strategy and \'If-Range\' (not matching)', () => handle({
      request: {
        method: 'HEAD',
        url: './lorem ipsum.txt',
        headers: {
          range: 'bytes=6-11'
        }
      },
      mapping: {
        'caching-strategy': 'modified'
      }
    })
      .then(({ redirected, response }) => redirected.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 206)
        const lastModified = response.headers['Last-Modified']
        assert.ok(!!lastModified)
        return handle({
          request: {
            method: 'GET',
            url: './lorem ipsum.txt',
            headers: {
              range: 'bytes=6-11',
              'If-Range': lastModified
            }
          },
          mapping: {
            'caching-strategy': 'modified'
          }
        })
      }))
      .then(({ redirected, response }) => redirected.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers['Content-Type'], textMimeType)
        assert.ok(!response.headers['Content-Range'])
        assert.ok(parseInt(response.headers['Content-Length'], 10) > 6)
        assert.ok(response.toString().startsWith('Lorem ipsum dolor sit amet,'))
      }))
    )
  })

  describe('request abortion', () => {
    it('stops transfer if request is aborted', () => handle({
      request: {
        method: 'GET',
        url: './file.txt'
      }
    })
      .then(({ redirected, request, response }) => {
        request.abort()
        return redirected
          .then(value => {
            assert.strictEqual(value, undefined)
            assert.strictEqual(response.statusCode, 200)
            assert.strictEqual(response.headers['Content-Type'], textMimeType)
            assert.strictEqual(response.headers['Content-Length'], '12')
            assert.strictEqual(response.toString(), '')
          })
      })
    )

    it('stops transfer if request is aborted (after createReadStream)', () => {
      let allocatedRequest
      const customFs = {
        stat: promisify(fs.stat),
        readdir: promisify(fs.readdir),
        createReadStream: (path, options) => {
          allocatedRequest.abort()
          return Promise.resolve(fs.createReadStream(path, options))
        }
      }
      return handle({
        request: {
          method: 'GET',
          url: './file.txt'
        },
        mapping: {
          'custom-file-system': customFs
        }
      })
        .then(({ redirected, request, response }) => {
          allocatedRequest = request
          return redirected
            .then(value => {
              assert.strictEqual(value, undefined)
              assert.strictEqual(response.statusCode, 200)
              assert.deepStrictEqual(response.headers, {})
              assert.strictEqual(response.toString(), '')
            })
        })
    })
  })

  describe('caching-strategy', () => {
    const verbs = 'HEAD,GET'.split(',')

    it('is validated', () => handle({
      request: './file.txt',
      mapping: {
        'caching-strategy': 'unknown'
      }
    })
      .then(notExpected, reason => {
        assert.ok(reason.toString().includes('Invalid caching-strategy name'))
      })
    )

    describe('0 - default no caching', () => {
      verbs.forEach(verb => it(`returns proper caching information (${verb})`, () => handle({
        request: {
          method: verb,
          url: './file.txt'
        },
        mapping: {
          'caching-strategy': 0
        }
      })
        .then(({ redirected, response }) => redirected.then(value => {
          assert.strictEqual(value, undefined)
          assert.strictEqual(response.statusCode, 200)
          assert.strictEqual(response.headers['Cache-Control'], 'no-store')
          assert.strictEqual(response.headers['Content-Type'], textMimeType)
          assert.strictEqual(response.headers['Content-Length'], '12')
        }))
      ))
    })

    describe('Any number - max-age', () => {
      verbs.forEach(verb => it(`returns proper caching information (${verb})`, () => handle({
        request: {
          method: verb,
          url: './file.txt'
        },
        mapping: {
          'caching-strategy': 3475
        }
      })
        .then(({ redirected, response }) => redirected.then(value => {
          assert.strictEqual(value, undefined)
          assert.strictEqual(response.statusCode, 200)
          assert.strictEqual(response.headers['Cache-Control'], 'public, max-age=3475, immutable')
          assert.strictEqual(response.headers['Content-Type'], textMimeType)
          assert.strictEqual(response.headers['Content-Length'], '12')
        }))
      ))
    })

    describe('"modified" - last-modified', () => {
      verbs.forEach(verb => it(`returns proper caching information (${verb})`, () => handle({
        request: {
          method: verb,
          url: './file.txt'
        },
        mapping: {
          'caching-strategy': 'modified'
        }
      })
        .then(({ redirected, response }) => redirected.then(value => {
          assert.strictEqual(value, undefined)
          assert.strictEqual(response.statusCode, 200)
          assert.strictEqual(response.headers['Cache-Control'], 'no-cache')
          assert.strictEqual(response.headers['Last-Modified'], 'Wed, 30 Sep 2020 18:51:00 GMT')
          assert.strictEqual(response.headers['Content-Type'], textMimeType)
          assert.strictEqual(response.headers['Content-Length'], '12')
        }))
      ))

      verbs.forEach(verb => it(`does not stream the file back if not modified (${verb})`, () => handle({
        request: {
          method: verb,
          url: './file.txt',
          headers: {
            'if-modified-since': 'Wed, 30 Sep 2020 18:51:00 GMT'
          }
        },
        mapping: {
          'caching-strategy': 'modified'
        }
      })
        .then(({ redirected, response }) => redirected.then(value => {
          assert.strictEqual(value, undefined)
          assert.strictEqual(response.statusCode, 304)
          assert.strictEqual(response.headers['Cache-Control'], 'no-cache')
          assert.strictEqual(response.headers['Last-Modified'], 'Wed, 30 Sep 2020 18:51:00 GMT')
          assert.strictEqual(response.headers['Content-Type'], textMimeType)
          assert.strictEqual(response.headers['Content-Length'], '12')
          assert.strictEqual(response.toString(), '')
        }))
      ))

      verbs.forEach(verb => it(`streams the file back if modified (${verb})`, () => handle({
        request: {
          method: verb,
          url: './file.txt',
          headers: {
            'if-modified-since': 'Wed, 30 Sep 2020 18:50:00 GMT'
          }
        },
        mapping: {
          'caching-strategy': 'modified'
        }
      })
        .then(({ redirected, response }) => redirected.then(value => {
          assert.strictEqual(value, undefined)
          assert.strictEqual(response.statusCode, 200)
          assert.strictEqual(response.headers['Cache-Control'], 'no-cache')
          assert.strictEqual(response.headers['Last-Modified'], 'Wed, 30 Sep 2020 18:51:00 GMT')
          assert.strictEqual(response.headers['Content-Type'], textMimeType)
          assert.strictEqual(response.headers['Content-Length'], '12')
          if (verb === 'GET') {
            assert.strictEqual(response.toString(), 'Hello World!')
          }
        }))
      ))
    })
  })

  describe('mime-types', () => {
    it('overrides default mime types', () => handle({
      request: {
        method: 'GET',
        url: './file.txt'
      },
      mapping: {
        'mime-types': {
          txt: 'not-even-existing'
        }
      }
    })
      .then(({ redirected, response }) => redirected.then(value => {
        assert.strictEqual(value, undefined)
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.headers['Content-Type'], 'not-even-existing')
      }))
    )
  })

  describe('static', () => {
    describe('default', () => {
      it('caches file system by default', async () => {
        const { redirected, mapping } = await handle({
          request: {
            method: 'GET',
            url: './file.txt'
          }
        })
        await redirected
        assert.notStrictEqual(mapping[$fileCache], undefined)
      })

      it('does *not* cache file system when custom-file-system is used', async () => {
        const { redirected, mapping } = await handle({
          request: {
            method: 'GET',
            url: './file.txt'
          },
          mapping: {
            'custom-file-system': {
              stat: promisify(fs.stat),
              readdir: promisify(fs.readdir),
              createReadStream: (path, options) => Promise.resolve(fs.createReadStream(path, options))
            }
          }
        })
        await redirected
        assert.strictEqual(mapping[$fileCache], undefined)
      })
    })

    it('caches file system information', async () => {
      const { redirected, mapping } = await handle({
        request: {
          method: 'GET',
          url: './file.txt'
        }
      })
      await redirected
      const cache = mapping[$fileCache]
      assert.notStrictEqual(cache.keys().length, 0)
      const stat = await cache.get('stat:/file.txt')
      assert.strictEqual(stat.size, 12)
    })

    it('can cache file system when custom-file-system is used', async () => {
      const { redirected, mapping } = await handle({
        request: {
          method: 'GET',
          url: './file.txt'
        },
        mapping: {
          static: true,
          'custom-file-system': {
            stat: promisify(fs.stat),
            readdir: promisify(fs.readdir),
            createReadStream: (path, options) => Promise.resolve(fs.createReadStream(path, options))
          }
        }
      })
      await redirected
      assert.notStrictEqual(mapping[$fileCache], undefined)
    })
  })
})
