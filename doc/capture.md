# `capture` helper

Since version 1.8.0, the package offers a mechanism to **capture the response stream** and **duplicate its content** to another **writable stream**.

**NOTE** : The content is decoded if the [`content-encoding`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding) header contains: `gzip`, `deflate` or `br` *(only one, no combination is supported)*.

**NOTE** : Check the [version of Node.js](https://nodejs.org/api/zlib.html#zlib_class_zlib_brotlicompress) to enable `br` compression support.

For instance, it enables the caching of downloaded resources :

```JavaScript
mappings: [{
  match: /^\/(.*)/,
  file: './cache/$1',
  'ignore-if-not-found': true
}, {
  method: 'GET',
  custom: async (request, response) => {
    if (/\.(js|css|svg|jpg)$/.exec(request.url)) {
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
  url: 'http://your.website.domain/$1'
}]
```

