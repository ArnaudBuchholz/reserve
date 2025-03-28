# Migration from v1 to v2

[🔝 REserve documentation](README.md)

Because of the **breaking changes** in v2, here are some recommendations on how to migrate from [v1](https://github.com/ArnaudBuchholz/reserve/blob/1.x/docs/README.md).

## 📦 Dependencies

REserve does not support `mime` and `colors` packages anymore :
* The [`log` helper](log.md) produces non colored traces.
* Mime types, if needed, can be overloaded / completed directly on the [`file`](file.md) mapping through the `mime-types` setting. The default list of mime types is available [here](https://github.com/ArnaudBuchholz/reserve/blob/main/reserve/src/mime.json).

## ⚙ `custom` handler

### 🚫 `watch` option

The `watch` option has been removed.

If you need to refresh the implementation of a custom function when the implementation module timestamp changes, create a wrapper to proxify the module and reload it when needed.

```javascript
const { stat } = require('fs/promises')
const $timestamp = Symbol('timestamp')
const $callback = Symbol('callback')
const moduleName = '/usr/dev/reserve/samples/example.js' // Must be an absolute path

export const mapping = {
  custom: async function (request, response) {
    const timestamp = (await stat(moduleName)).mtimeMs
    if (timestamp !== this[$timestamp]) {
      this[$timestamp] = timestamp
      delete require.cache[moduleName]
      this[$callback] = require(moduleName)
    }
    return this[$callback](request, response)
  }
}
```

> Example of a `custom` implementation with a refresh mechanism

### `configuration`

Previously, a `configuration` member was added to the mapping to give access to the [configuration interface](iconfiguration.md) **only when** no existing member named `configuration` was existing.

Now the member is **always** set. Rename the member `configuration` if you need one.

### callback function

The capturing groups are passed to the callback only if the signature of the function ([`function.length`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/length)) is `0` or strictly greater than `2`.

> [!WARNING]
> Because of [rest parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters), the following function has a length of `2`.

```javascript
function (request, response, ...parameters) {
  /* ... */
}
```

## ⚙ `file` handler

### 🚫 `strict` and `case-sensitive` options

> [!IMPORTANT]
> Because the development was initiated on Windows, the path finding was done *case insensitively*. This was causing some issues when porting the implementation to other operating systems. Hence, the option `case-sensitive` was later added to compensate.
>
> The same way, Node.js file system API is flexible with file access and *empty folders* are simply ignored. For instance, `src/index.js` is *equivalent* to `src///index.js`. This was obviously not right and the option `strict` was added to address the issue (`strict` also implied `case-sensitive`).

These two options are **removed**. However,

* The `file` handler checks path **case sensitively**,
* REserve **normalizes** inbound URL limiting the risk of receiving empty folders.

> [!TIP]
> If you need case insensitive path finding, use a [custom file system](file.md#custom-file-system).

### 🚫 `ignore-if-not-found`

> [!NOTE]
> In version 1, the `file` handler returned a `404` error if the path could not be found / read or was invalid.
> 
> It was possible to prevent this by setting `ignore-if-not-found` to `true`.

The option is **removed** and the `file` handler **never** generates a `404`, meaning if no file or folder is found, the mapping is ignored.

The `404` behavior can then be reproduced by adding another mapping with the same matching criteria but using the [`status`](status.md) handler with the code `404`.

### 🚫 `http-status`

This option has been **removed**. To achieve the same result, use a custom handler setting `response.statusCode` to the expected value *before* the file mapping.

## ⚡ Server events

* The `server-created` event name was shortened to `created`.

## 🧰 `body` helper

[`body(request)`](body.md) nows resolve to a [`Buffer`](https://nodejs.org/docs/latest/api/buffer.html).

If the request's `content-type` is specified and starts with :
* `text/plain` : a `string` is returned
* `application/json` : an `object` is returned _(after applying [`JSON.parse`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse) on the request content)_.

To **preserve** the former behavior, simply replace `body(request)` calls to `body(request).text()`.

## 🧪 Testing / Mocking

### `mock`

Previously, the `mock` function was returning a promise giving back the mock server.

To mimic the behavior of the `serve` function, the promise resolves to a server object and you **must** wait for the `ready` event to use the `request` function.

```javascript
read('/reserve.json')
  .then(configuration => mock(configuration))
  .then(mocked => new Promise((resolve, reject) => {
    const mocked = mock(configuration)
    mocked
      .on('ready', () => resolve(mocked))
      .on('error', reject)
  }))
  .then(mocked => {
    return mocked.request('GET', '/')
  })
```

> Example of `mock` usage

### `Request` and `Response`

* The headers are **not** storing numbers anymore, they are **converted** to string. This may **impact** your tests.

> [!CAUTION]
> A typical example is the [`Content-Length`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Length) header attribute which contains a number.

* The request url goes through normalization, meaning :

  * `mock.request('GET', 'count')` generates `'/count'` url
  * `mock.request('GET', '/echo/hello world')` generates `'/echo/hello%20world'` url
