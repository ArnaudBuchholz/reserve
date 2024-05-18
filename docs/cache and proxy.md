# Cache and Proxy

With version 1.8.0, [REserve](https://www.npmjs.com/package/reserve) offers **the capture helper** that enables the **copy of the response content while processing a request**. In this article, an example will be presented in two different flavors to illustrate the **new possibilities** introduced by this tool.

> [!NOTE]
> This article was written in 2020.
> Unfortunately, the `facetheforce.today` website does not exist anymore.
> Yet, the content is still relevant to REserve.

# Caching the content of a site

## Redirecting

First, let's build a local web server with REserve that **redirects** received requests to an existing **remote site** thanks to the `url` handler. The source file is listed below.

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

> A simple web server built with REserve

When opening the browser to [localhost:8005](http://localhost:8005), the content of [http://facetheforce.today/](http://facetheforce.today/) is displayed as shown in the following preview.

![Face the force today](cache%20and%20proxy/Face%20the%20Force%20Today.png)

> Preview of the Face the force today website as seen through the local web server

## Saving resources

Now, we improve the web server by introducing a **custom mapping** that **captures** some of the responses to **save them locally**. This new code is inserted **before the existing mapping** as listed below.

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

> The web server improved with a capturing mapping

Using the request url, the **resource extension** is extracted and if it matches a **list of known types** (.ico, .js, .css ...), a file path is computed, the corresponding folder is created *(if missing)* and a **write stream is initiated**.

Then, the **capture helper** is called to **copy the content of the response to the write stream**. This call returns a **promise** that is resolved when the **stream is finished**.

**Note** that this mapping will **not answer the request**, meaning that the **processing will continue** to the next mapping *(which redirects to the remote site)*.

After **restarting** the server and **reloading** the page in the browser, the **cache folder contains all the copied resources**. For instance, the next screenshot shows the content of the image folder.

![Content of the cache\images folder](cache%20and%20proxy/Face%20the%20Force%20Today%20cache%20content.png)

> Content of the cache\images folder

If we focus on the request made to grab the file `styles.css`, we observe that it was sent with the `gzip` [content-encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding). This can be verified in the **network tab** of the debugger as illustrated below.

![Request details of the styles.css resource](cache%20and%20proxy/Face%20the%20Force%20Today%20with%20style%20request%20details.png)

> styles.css request detail

But as you can see in the following notepad screenshot, the cached file is **readable as plain text**.

![styles.css content](cache%20and%20proxy/Face%20the%20Force%20Today%20styles%20content.png)

> cached styles.css content

Another benefit of the **capture helper** is that it **automatically decompresses streams**.

## Caching

The local server is capable of **capturing the resources and saving them locally**. One last addition to the mappings will **reduce the load to the remote site** by **serving the resources locally** if they exist.

This is done by adding a `file` mapping as listed below. When the **file exists**, the mapping will **handle the request**. If the **file does not exist**, the `ignore-if-not-found` option will tell the **handler ignore the request** and give a chance to the **following mappings to process it**.

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

> The web server modified to serve locally cached files

If we look again on the request made to grab the file `styles.css`, we notice that it was sent with **no encoding** *(and very few response headers)*.

![Request details of the cached styles.css resource](cache%20and%20proxy/Face%20the%20Force%20Today%20with%20cached%20style%20request%20details.png)

> cached styles.css request detail

# Caching the content of any site

The previous web server works fine but it requires **adjustments** every time we want to capture **another remote site**.

On the other hand, it does not need a lot of modifications to be **transformed into a simple [web proxy server](https://en.wikipedia.org/wiki/Proxy_server)**. Like our initial server, web proxies are designed to forward HTTP requests. The request from the client is the same as a regular HTTP request **except the full URL is passed**.

In the new code below, caching works the same but the **server name is used as a root folder** under the `cache` one.

**Note** that the `custom` handler function receives **[capturing group](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Groups_and_Ranges) values** of the matching regular expression as additional parameters (respectively `server` and `path`).

```javascript
const { createWriteStream, mkdir } = require('fs')
const { dirname, join } = require('path')
const { capture, log, serve } = require('..')

const mkdirAsync = require('util').promisify(mkdir)

const cacheBasePath = join(__dirname, 'cache')
 // Should wait for completion
mkdirAsync(cacheBasePath, { recursive: true })

log(serve({
  port: 8080,
  mappings: [{
    match: /^http:\/\/([^/]*)\/(.*)/,
    file: './cache/$1/$2',
    'ignore-if-not-found': true
  }, {
    method: 'GET',
    match: /^http:\/\/([^/]*)\/(.*)/,
    custom: async (request, response, server, path) => {
      if (/\.(ico|js|css|svg|jpe?g)$/.exec(path)) {
        const cachePath = join(cacheBasePath, server, path)
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
    match: /^(.*)/,
    url: '$1'
  }]
}), process.argv.includes('--verbose'))
```

> The previous code modified to build a web proxy server

Once the **server is started**, we use the operating system to **setup the HTTP proxy**. As shown in the next screenshot, Chrome offers a **shortcut** to access these settings. 

![Chrome settings](cache%20and%20proxy/Chrome%20settings.png)

> Chrome settings

On Ubuntu, you need to **click the Network Proxy button**.

![Ubuntu network settings](cache%20and%20proxy/Ubuntu%20network%20proxy.png)

> Ubuntu network settings

And then **point to the running server**, like in the next screenshot.

![Ubuntu proxy settings](cache%20and%20proxy/Ubuntu%20proxy%20settings.png)

> Ubuntu network settings

Once everything is configured, you can **browse any HTTP site** and the **resources are saved automatically**.

For instance...

![Proxy cache folder](cache%20and%20proxy/Proxy%20cache%20folder.png)

> Proxy cache folder

# To conclude

The sample given here is far from being perfect and it **can be improved** to better handle :
* other file types
* optional URL parameters
* cache control headers
* the growing size of the `cache` folder
* ...

But the purpose here is to demonstrate how [REserve](https://www.npmjs.com/package/reserve) can be useful by providing **essential tools and features** to quickly **build an advanced web site**.
