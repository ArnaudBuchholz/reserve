# Migration from v1 to v2

## Overview

REserve does not support `mime` or `colors` anymore. The main reasons are :
- `colors` package does not provide much *functional value*
- mime types, if needed, can be overloaded / completed directly on the [`file`](file.md) mapping making `mime` package useless for most use cases
- to maintain compatibility with CommonJS **and** ESM, these packages were removed from the default build

## `watch` option on `custom`

The `watch` option was initially created to simplify development by *refreshing* the implementation if the external module file timestamp changes.
As REserve starts very fast, it was rarely used and has been removed.

## `file` options change

### `strict` and `case-sensitive` options

Because the development was initiated on a Windows file system, the path finding was done case insensitively. This was causing some issues when porting the implementation to other operating systems. Hence, the option `case-sensitive` was later added to compensate.

The same way, Node.js file system API is flexible with file access and *empty folders* are simply ignored. For instance, `src/index.js` is *equivalent* to `src///index.js`. This was obviously not right and the option `strict` was added to correct it (`strict` also implied `case-sensitive`).

These two options are now enabled by default and the only way to 'revert' it is to use a custom file system.

### `ignore-if-not-found`

Before version 2, the `file` handler was returning a `404` error if the path could not be found / read or was invalid.

It was possible to prevent this by setting `ignore-if-not-found` to `true`.
The same thing can be added by adding another mapping right after that uses the [`status`](status.md) handler with the code `404` (with the same matching criteria if needed).

Hence the option is now removed and the `file` handler never generates a `404`.

### `http-status`

This option has been removed. To achieve the same result, use a custom handler setting `response.statusCode` to the expected value *before* the file mapping.
