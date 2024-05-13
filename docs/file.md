# `file` handler

[🔝 REserve documentation](README.md)

Answers the request using **file system**.

```json
{
  "match": "^/(.*)",
  "file": "./$1"
}
```

> Example of mapping with the `file` handler

## Features

* Supports [GET](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/GET) and [HEAD](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/HEAD)
* Capturing groups can be used as substitution parameters
* **Always relative** to the handler's `cwd` member *(see [mappings](configuration.md#mappings))* :
  * [🛂 Path traversal](https://owasp.org/www-community/attacks/Path_Traversal) is blocked
* Incoming URL parameters (and hash) are removed when resolving to file
* Directory access is mapped to the inner `index.html` file *(if any)*
* If the path resolves to a missing / unreadable / invalid file or directory, the handler does **not** process the request
  * Folder names are case-sensitively checked (⚠️ Windows)
* Supports [`Range` HTTP header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range) *(only one range)*
* If the response already owns a `statusCode` different from `200`, the file handler will keep it
* Only a limited subset of mime types is pre-configured (see [mime.json](https://github.com/ArnaudBuchholz/reserve/blob/main/reserve/src/mime.json)), use `mime-types` to extend

## Options

| option | type | default | description |
|---|---|---|---|
| `mime-types` | `{ [key: string]: string }` | `{}` | Dictionary indexed by file extension that overrides mime type resolution.<br>For instance : `{ "gsf": "application/x-font-ghostscript" }`. |
| `caching-strategy` | `'modified'` \| `number` | `0` | Configures caching strategy:<br>• `'modified'` : use file last modification date, meaning the response header will contain [`Last-Modified`](https://developer.mozilla.org/fr/docs/Web/HTTP/Headers/Last-Modified) and the handler reacts to request headers [`If-Modified-Since`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since) and [`If-Range`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Range),<br>• `number` : duration (in seconds), based on the response header [`Cache-Control` with `max-age`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control),<br>• `0` : [`Cache-Control` with `no-store`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control). |
| `custom-file-system` | [`ExternalModule`](external.md) \| `CustomFileSystem` | `undefined` | Provides custom file system API *(see below)*. |
| `static` | `boolean` \| `PunycacheOptions` | *depends on `custom-file-system`* | Cache file system information for performance.<br>When `custom-file-system` is used, `static` is `false` by default *(but can be overridden)*.<br>Otherwise, `static` is `true` by default.<br>An object can be used to pass options to the cache handler, see [`punycache`](https://www.npmjs.com/package/punycache) documentation.|

**NOTE** : When `static` is enabled, REserve does not expect the files / folders to change. For instance, if the file size changes while its information has been cached, the result might appear corrupted.

## Custom File System

The custom file system is an **object** exposing several **asynchronous** methods.

### `async readdir (folderPath)`

This is the asynchronous equivalent of [fs.readdir](https://nodejs.org/api/fs.html#fs_fs_readdir_path_options_callback). No option is transmitted.

It must return a promise resolved to an array of names listing the files or folders contained in the `folderPath`.

### `async stat (filePath)`

This is the asynchronous equivalent of [fs.stat](https://nodejs.org/api/fs.html#fs_fs_stat_path_options_callback). No option is transmitted.

It must return an object equivalent to [fs.Stats](https://nodejs.org/api/fs.html#fs_class_fs_stats) but **limited** to :
* [`isDirectory()`](https://nodejs.org/api/fs.html#fs_stats_isdirectory)
* [`size`](https://nodejs.org/api/fs.html#fs_stats_size)
* [`mtime`](https://nodejs.org/api/fs.html#fs_stats_mtime)

### `async createReadStream (filePath, options)`

This is the asynchronous equivalent of [fs.createReadStream](https://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options).  When `options` is specified, it contains only `start` and `end`.

It must return a [readable stream](https://nodejs.org/api/fs.html#stream_class_stream_readable).
