# Migration from v1 to v2

Following the breaking changes of v2, here are some recommendations on how to migrate from v1.

## Dependencies

REserve does not support `mime` or `colors` anymore. The main reasons are :
- `colors` package does not provide much *functional value*
- mime types, if needed, can be overloaded / completed directly on the [`file`](file.md) mapping making `mime` package useless for most use cases
- to maintain compatibility with CommonJS **and** ESM, these packages were removed from the default build

## Events

* The `server-created` event was shortened to `created`.

## `custom` handler

### `watch` option

The `watch` option was initially created to simplify development by *refreshing* the implementation if the external module file timestamp changes.
As REserve starts very fast, it was rarely used and has been removed.

### `configuration`

Previously, a `configuration` member was added to the mapping to give access to the [configuration interface](iconfiguration.md) only if no existing member named `configuration` was existing.

Now the member is **always** set.

### callback function

The capturing groups are passed to the callback only if the signature of the function ([`function.length`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/length)) is `0` or greater than `2`.

⚠️ **WARNING** : the following function has a length of `2`.
```javascript
function (request, response, ...parameters) {

}
```

Hence it is recommended to use this signature :
```javascript
function (request, response, firstParameter, ...otherParameters) {

}
```

## `file` handler

### `strict` and `case-sensitive` options

Because the development was initiated on a Windows file system, the path finding was done case insensitively. This was causing some issues when porting the implementation to other operating systems. Hence, the option `case-sensitive` was later added to compensate.

The same way, Node.js file system API is flexible with file access and *empty folders* are simply ignored. For instance, `src/index.js` is *equivalent* to `src///index.js`. This was obviously not right and the option `strict` was added to correct it (`strict` also implied `case-sensitive`).

These two options are now enabled by default and the only way to 'revert' it is to use a custom file system.

### `ignore-if-not-found`

Before version 2, the `file` handler was returning a `404` error if the path could not be found / read or was invalid.

It was possible to prevent this by setting `ignore-if-not-found` to `true`.
The `404` behavior can then be reproduced by adding another mapping right after that uses the [`status`](status.md) handler with the code `404` (with the same matching criteria if needed).

Hence the option is now removed and the `file` handler never generates a `404`.

### `http-status`

This option has been removed. To achieve the same result, use a custom handler setting `response.statusCode` to the expected value *before* the file mapping.

## Helpers

### `mock`

Previously, the `mock` function was returning a promise giving back the mock server.
To mimic the behavior of the `serve` function, the promise resolves to a server object and you **must** wait for the `ready` event to use the `request` function.

### `Request` and `Response`

The headers are not storing numbers anymore, they are converted to string. This might impact your tests. A typical example is the `Content-Length` header attribute.

The request url goes through normalization, meaning :

* `mock.request('GET', 'count')` generates `'/count'` url
* `mock.request('GET', '/echo/hello world')` generates `'/echo/hello%20world'` url

### `body`

By default, [`body`](body.md) nows resolve to a [`Buffer`](https://nodejs.org/docs/latest/api/buffer.html) or, if the `content-type` is specified in the request headers a `string` (`text/plain`) or an `object` (`application/json`).

To **preserve** former behavior, simply replace `body(request)` calls to `body(request).text()`
