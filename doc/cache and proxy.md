# Cache and Proxy

With version 1.8.0, [REserve](https://www.npmjs.com/package/reserve) offers **the capture helper** that enables the **copy of the response content while processing a request**. In this article, the same example will be presented in two different flavors to illustrate the **new possibilities** introduced by this tool.

# Caching the content of a site

## Redirecting

First, let's build a local web server that **redirects** received requests to an existing remote site thanks to the `url` handler.

```javascript
const { log, serve } = require('reserve')

log(serve({
  port: 8005,
  mappings: [{
    match: /^\/(.*)/,
    url: 'http://facetheforce.today/$1'
  }]
}), process.argv.includes('--verbose'))
```
*<u>A simple web server built with REserve</u>*

When opening the browser to [localhost:8005](http://localhost:8005), the content of [http://facetheforce.today/](http://facetheforce.today/) is displayed.

![Face the force today](Face%20the%20Force%20Today.png)
*<u>Preview of the Face the force today website</u>*

## Saving resources

Now, we improve the web server by introducing a **custom mapping** that **captures** some of the responses to **save them locally**. 

Using the request url, the **resource extension** is extracted and if it matches a **list of known types** (.ico, .js, .css ...), a file path is computed, the corresponding folder is created *(if missing)* and a **write stream is initiated**.

Then, the **capture helper** is called to **copy the content of the response to the write stream**. This call returns a promise that is resolved when the stream is finished.

```javascript
const { createWriteStream, mkdir } = require('fs')
const { dirname, join } = require('path')
const { capture, log, serve } = require('..')

const mkdirAsync = require('util').promisify(mkdir)

const cacheBasePath = join(__dirname, 'cache')
// Should wait for completion
mkdirAsync(cacheBasePath, { recursive: true })

log(serve({
  port: 8005,
  mappings: [{
    method: 'GET',
    custom: async (request, response) => {
      if (/\.(ico|js|css|svg|jpe?g)$/.exec(request.url)) {
        const cachePath = join(cacheBasePath, '.' + request.url)
        const cacheFolder = dirname(cachePath)
        await mkdirAsync(cacheFolder, { recursive: true })
        const file = createWriteStream(cachePath) // auto closed
        capture(response, file)
          .catch(reason => {
            console.error(`Unable to cache ${cachePath}`, reason)
          })
      }
    }
  }, {
    match: /^\/(.*)/,
    url: 'http://facetheforce.today/$1'
  }]
}), process.argv.includes('--verbose'))
```
*<u>The web server improved with a capturing mapping</u>*

If we focus on the request made to grab the file `styles.css`, we notice that it was initially sent with the `gzip` [content-encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding)

![Request details of the styles.css resource](Face%20the%20Force%20Today%20with%20style%20request%20details.png)
*<u>Preview of the Face the force today website</u>*

## Caching

```javascript
'use strict'

const { createWriteStream, mkdir } = require('fs')
const { dirname, join } = require('path')
const { capture, log, serve } = require('..')

const mkdirAsync = require('util').promisify(mkdir)

const cacheBasePath = join(__dirname, 'cache')
mkdirAsync(cacheBasePath, { recursive: true }) // Should wait for completion

log(serve({
  port: 8005,
  mappings: [{
    match: /^\/(.*)/,
    file: './cache/$1',
    'ignore-if-not-found': true
  }, {
    method: 'GET',
    custom: async (request, response) => {
      if (/\.(ico|js|css|svg|jpe?g)$/.exec(request.url)) {
        const cachePath = join(cacheBasePath, '.' + request.url)
        const cacheFolder = dirname(cachePath)
        await mkdirAsync(cacheFolder, { recursive: true })
        const file = createWriteStream(cachePath) // auto closed
        capture(response, file)
          .catch(reason => {
            console.error(`Unable to cache ${cachePath}`, reason)
          })
      }
    }
  }, {
    match: /^\/(.*)/,
    url: 'http://facetheforce.today/$1'
  }]
}), process.argv.includes('--verbose'))
```

# Caching any remote site