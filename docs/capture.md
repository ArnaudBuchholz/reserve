# `capture` helper

[🔝 REserve documentation](README.md)

REserve offers a mechanism to **capture the response stream** and **duplicate its content** to another **writable stream**.

```typescript
function capture (response: ServerResponse, stream: WritableStream): Promise<void>
```

> Types definition for `capture`

> [!IMPORTANT]
> The content is decoded if the [`content-encoding`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding) header contains: `gzip`, `deflate` or `br` *(only one, no combination is supported)*.

> [!CAUTION]
> Check the [version of Node.js](https://nodejs.org/api/zlib.html#zlib_class_zlib_brotlicompress) to enable `br` compression support.

In the following example, three mappings are used :

1. If the request resource exists in the `cache` folder , it is returned.
2. Otherwise, the second mapping captures and serializes locally the response returned by the last mapping.
3. The last mapping redirects the request to an external site. 

```JavaScript
mappings: [{
  match: /^\/(.*)/,
  file: './cache/$1'
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

> Example of `capture` used to cache resources
