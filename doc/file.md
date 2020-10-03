# `file` handler

Answers the request using **file system**.

Example :
```json
{
  "match": "^/(.*)",
  "file": "./$1"
}
```

* Supports [GET](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/GET) and [HEAD](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/HEAD)
* Capturing groups can be used as substitution parameters
* Absolute or relative to the handler's `cwd` member *(see [mappings](configuration.md#mappings))*
* Incoming URL parameters are automatically stripped out to simplify the matching expression
* Directory access is internally redirected to the inner `index.html` file *(if any)* or `404` status
* File access returns `404` status if missing or can't be read
* Supports [`Range` HTTP header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range) *(only one range)*
* Mime type computation is based on [`mime`](https://www.npmjs.com/package/mime) **if installed**. Otherwise a limited subset of mime types is used:

|Extension|mime type|
|---|---|
|bin|application/octet-stream|
|css|text/css|
|gif|image/gif|
|html|text/html|
|htm|text/html|
|jpeg|image/jpeg|
|jpg|image/jpeg|
|js|application/javascript|
|mp4|video/mp4|
|pdf|application/pdf|
|png|image/png|
|svg|image/svg+xml|
|text|text/plain|
|txt|text/plain|
|xml|application/xml|

| option | type | default | description |
|---|---|---|---|
| `case-sensitive` | Boolean | `false` | *(for Windows)* when `true`, the file path is tested case sensitively. Since it has an impact on **performances**, use carefully. |
| `ignore-if-not-found` | Boolean | `false` | If the mapping does not resolve to a file or a folder, the handler does not end the request with status `404`. |
| `custom-file-system` | String or Object | undefined | Provides custom file system API *(see below)*. |
| `caching-strategy` | `'modified'` or Number | 0 | Configures caching strategy:  |
|||| `'modified'`: use file last modification date, meaning the response header will contain [`Last-Modified`](https://developer.mozilla.org/fr/docs/Web/HTTP/Headers/Last-Modified) and the handler reacts to request headers [`If-Modified-Since`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since) and [`If-Range`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Range)  |
|||| any number: hard coded duration (in seconds), based on the response header [`Cache-Control` with `max-age`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control) |
|||| 0 *(default)*: [`Cache-Control` with `no-store`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control) |

## Custom File System

The custom file system is an **object** exposing several **asynchronous** methods.

Some are mandatory, others depend on the **settings** of the mapping.

### *optional* `async readdir (folderPath)`

This is the asynchronous equivalent of [fs.readdir](https://nodejs.org/api/fs.html#fs_fs_readdir_path_options_callback). No option is transmitted.

It must return a promise resolved to an array of names listing the files or folders contained in the `folderPath`.

It is mandatory only if the `case-sensitive` option is set on the mapping.

### *mandatory* `async stat (filePath)`

This is the asynchronous equivalent of [fs.stat](https://nodejs.org/api/fs.html#fs_fs_stat_path_options_callback). No option is transmitted.

It must return an object equivalent to [fs.Stats](https://nodejs.org/api/fs.html#fs_class_fs_stats) but **limited** to :
* [`isDirectory()`](https://nodejs.org/api/fs.html#fs_stats_isdirectory)
* [`size`](https://nodejs.org/api/fs.html#fs_stats_size)
* [`mtime`](https://nodejs.org/api/fs.html#fs_stats_mtime)

### *mandatory* async createReadStream (filePath, options)

This is the asynchronous equivalent of [fs.createReadStream](https://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options).  When `options` is specified, it contains only `start` and `end`.

It  must return a [readable stream](https://nodejs.org/api/fs.html#stream_class_stream_readable).
