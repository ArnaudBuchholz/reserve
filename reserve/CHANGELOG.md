|Version|content|
|---|---|
|2.3.3|Limit the number of listeners on the request's socket|
|2.3.2|Fix type definition of (Mocked)Response|
|2.3.1|Improve detection of closed requests in the `url` handler|
|2.3.0|Fix simple matching when pattern ends with / ([#115](https://github.com/ArnaudBuchholz/reserve/issues/115))|
|2.3.0|While closing, server rejects incoming requests with status `503`|
|2.3.0|Server close now exposes options to terminate active connections|
|2.3.0|Speed improvement (replaced contexts dictionary with a map)|
|2.3.0|Fix `file` handlers static option, now defaulted to `false`|
|2.3.0|update to `punycache`@`1.0.1`|
|2.2.0|`custom` handlers can be a static array that is sent back as a response ([`custom`](https://github.com/ArnaudBuchholz/reserve/blob/main/docs/custom.md))|
|2.1.1|`send` headers handling is now case insensitive|
|2.1.0|`custom` handlers can return an array that is sent back as a response ([`custom`](https://github.com/ArnaudBuchholz/reserve/blob/main/docs/custom.md))|
|2.0.5|`wasm` mime type|
|2.0.4|Fixes package exports for type definitions|
|2.0.3|Fixes in type definitions|
|2.0.2|Fixed empty redirect handling in `file` ([#99](https://github.com/ArnaudBuchholz/reserve/issues/99))|
|2.0.1|Fixed memory leak in the dispatcher ([#97](https://github.com/ArnaudBuchholz/reserve/issues/97))|
|2.0.0|Refactoring to improve project structure and performances|
||⚠️BREAKING CHANGE: Support of CommonJS and ESM imports|
||⚠️BREAKING CHANGE: Remove support of `colors`|
||⚠️BREAKING CHANGE: Remove support of `mime`|
||⚠️BREAKING CHANGE: Remove option `watch` in `custom`|
||⚠️BREAKING CHANGE: Behavior of `configuration` in `custom`|
||⚠️BREAKING CHANGE: Behavior of capturing groups in `custom`|
||⚠️BREAKING CHANGE: Remove option `strict` in `file`|
||⚠️BREAKING CHANGE: Remove option `case-sensitive` in `file`, it is now always case sensitive|
||⚠️BREAKING CHANGE: Remove option `ignore-if-not-found` in `file`, mapping is ignored if resolving to a missing / unreadable / invalid path|
||⚠️BREAKING CHANGE: Remove option `http-status` in `file`|
||⚠️BREAKING CHANGE: `readdir` is now mandatory in custom file system for `file`|
||⚠️BREAKING CHANGE: In `file`, absolute path are forbidden, trying to access a folder above `cwd` fails|
||⚠️BREAKING CHANGE: In `file`, **no** response is sent if the request is aborted while allocating the read stream|
||⚠️BREAKING CHANGE: In `file`, **no** response is sent if the request is aborted while allocating the read stream|
||⚠️BREAKING CHANGE: In `file`, `static` behavior added ([`doc`](https://github.com/ArnaudBuchholz/reserve/blob/main/docs/file.md))|
||⚠️BREAKING CHANGE: Default configuration does not include proxy|
||⚠️BREAKING CHANGE: `mock` returns immediately even if the *server* is not ready (wait for `ready`)|
||⚠️BREAKING CHANGE: `Request` and `Response` are direct exports|
||⚠️BREAKING CHANGE: `Response`' `statusCode` is defaulted to `200`|
||⚠️BREAKING CHANGE: Headers of mocked Request and Response returns strings or array of strings|
||⚠️BREAKING CHANGE: Mocked Request normalizes the received URL|
||⚠️BREAKING CHANGE: `body` helper leverages request headers to switch between text and json deserialization|
||⚠️BREAKING CHANGE: `server-created` event is now renamed to `created`|
||⚠️BREAKING CHANGE: `match` interpretation and interpolation has evolved|
||⚠️BREAKING CHANGE: `if-match` signature and behavior change|
||Fix `use` to handle middleware that are not calling next|
||Response status code is preserved when set before `file`|
||`static` option for performant `file` delivery ([`doc`](https://github.com/ArnaudBuchholz/reserve/blob/main/docs/file.md))|
||Expose `send` helper ([doc](https://github.com/ArnaudBuchholz/reserve/blob/main/docs/send.md))|
||Expose `punycache` helper ([doc](https://www.npmjs.com/package/punycache))|
||Fix types definitions|
|1.15.9|Documentation update|
|1.15.8|Fix types definition (UseMapping)|
|1.15.7|Fix types definition (UseMapping)|
|1.15.6|Fix types definition (MockServer)|
|1.15.5|Documentation as github pages|
|1.15.4|Fix types definition (Configuration)|
||Fix url IP in `ready` event|
|1.15.3|Fix types definition (CustomMapping::custom, MockServer::request)|
|1.15.2|Improves types definition (adds status mapping, fixes file mapping)|
|1.15.1|`http-status` option in **file** handler *(enables HTTP status overriding)*|
|1.15.0|Improves configuration validation|
|1.14.0|`json` mime type|
|1.13.1|Improve typescript definitions and documentation|
|1.13.0|Introduces `close` to shutdown server|
|1.12.1|Improve typescript definitions|
|1.12.0|Typescript definitions|
||Support of Node.js 16|
||`absolute-location` option in **url** handler|
|1.11.7|Fix `unsecure-cookies` option in **url** handler to handle attributes without ending ; ([#51](https://github.com/ArnaudBuchholz/reserve/issues/51))|
|1.11.6|Improve `unsecure-cookies` option in **url** handler to handle `SameSite=None` ([#49](https://github.com/ArnaudBuchholz/reserve/issues/49))|
|1.11.5|Fix `custom-file-system` option in **file** handler to be relative to configuration file ([#47](https://github.com/ArnaudBuchholz/reserve/issues/47))|
|1.11.4|`mime-types` option in **file** handler *(enables mime type overriding)*|
|1.11.3|Fixes compatibility issue with mime 1.x ([#45](https://github.com/ArnaudBuchholz/reserve/issues/45))|
|1.11.2|Fixes paths when loading listeners ([#43](https://github.com/ArnaudBuchholz/reserve/issues/43))|
||Adds request `headers` in the **incoming** event parameters|
|1.11.1|**url** fix headers manipulation in case of HTTP/2|
|1.11.0|[HTTP/2](https://en.wikipedia.org/wiki/HTTP/2) support|
||Adds request `id` in the blocking requests list|
||**url** handler does not pipe content on aborted request|
||**custom** handler passes configuration interface through the mapping|
||Introduces [`configuration.dispatch`](iconfiguration.md#async-dispatch-request-response)|
||Exposes ̀`Request` and `Response` mocked class|
||Command line supports multiple configurations (use `--config` with comma separated names)|
|1.10.1|Detects and handles blocking situations during [`configuration.setMappings`](iconfiguration.md#async-setmappings-mappings-request-timeout--5000) ([#39](https://github.com/ArnaudBuchholz/reserve/issues/39))|
||Introduces `exclude-from-holding-list` to exclude blocking requests from holding [`configuration.setMappings`](iconfiguration.md#async-setmappings-mappings-request-timeout--5000) ([#39](https://github.com/ArnaudBuchholz/reserve/issues/39))|
|1.10.0|Enables redirection within the `url` handler through the `forward-response` hook (only `GET` and `HEAD` requests)|
|1.9.3|Fixes a coding issue that prevented requires of REserve exports when run through the command line ([#16](https://github.com/ArnaudBuchholz/reserve/issues/16))|
||Automatic port allocation (`port` set to `'auto'` or `0`)|
|1.9.2|`strict` option in **file** handler *(enables strict path matching)*|
|1.9.1|Fix traces and limit the verbose output to one liners|
||Headers in mocked `Request` and `Response` supports [Symbols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol) *(issue found with [nock](https://www.npmjs.com/package/nock) integration)*|
|1.9.0|Allocates unique ID per requests|
||Introduces `aborted` and `closed` events|
||Improves verbose logger (based on request IDs)|
||Improves mocking by offering additional properties merged to the request *(enables socket mocking)*|
||`mp4` mime type|
||**file** handler supports request abortion|
||**file** handler supports [`HEAD` HTTP method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/HEAD)|
||**file** handler supports [`Range` HTTP header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range)|
||`caching-strategy` option in **file** handler *(enables `cache-control` and `last-modified` headers)*|
||If an exception occurs during the handling of the `redirected` event, it is now logged *(was previously ignored)*|
||Introduces `invert-match` and `if-match` on mappings|
||Adds `ignore-unverifiable-certificate` option for the `url` handler|
||Headers in mocked `Request` and `Response` are handled case insensitively|
|1.8.2|Fixes `capture` helper for big streams *(decoder was not drained)*|
|1.8.1|Improves the `forward-request` callback to pass the incoming request|
||Reorganized documentation to enable frequent updates *(that do not require publishing)*|
|1.8.0|Improves end of streaming detection in `file` and `url` handlers|
||`capture` helper *(experimental)*|
||`custom` handler validation *(improved)*|
|1.7.1|Adds more context to `forward-request` and `forward-response` callbacks|
|1.7.0|Adds `listeners` configuration option|
||Adds `server-created` event available only to listeners|
||Secures events processing against exceptions|
||Adds `forward-request` and `forward-response` options for the `url` handler|
|1.6.1|Exposes `require('reserve').interpolate` *(see [Custom handlers](#custom-handlers))*|
|1.6.0|Implements `$%1` and `$&1` substitution parameters *(see [Custom handlers](#custom-handlers))*|
|1.5.0|`headers` option in **status** handler *(enables HTTP redirect)*|
||`ignore-if-not-found` option in **file** handler *(enables folder browsing with a separate handler)*|
|1.4.0|More [documentation](https://github.com/ArnaudBuchholz/reserve/tree/master/doc/README.md) |
||Exposes simple body reader (`require('reserve').body`)|
||Adds `method` specification *(handlers & mappings)*|
|1.3.0|Fixes infinite loop in the error handler|
||Adds *experimental* `use` handler for [express middleware functions](https://www.npmjs.com/search?q=keywords%3Aexpress%20keywords%3Amiddleware)|
||Makes the mapping `match` member optional|
|1.2.1|Fixes coloring in command line usage|
|1.2.0|Implements handlers' schema|
||Gives handlers access to a configuration interface|
||Prevents infinite loops during internal redirection (see `max-redirect`)|
|1.1.7|Compatibility with Node.js >= 12.9|
||Improves response mocking|
|1.1.6|Improves response mocking (`flushHeaders()` & `headersSent`)|
|1.1.5|Fixes relative path use of external handlers in `json` configuration|
|1.1.4|Enables external handlers in `json` configuration through [require](https://nodejs.org/api/modules.html#modules_require_id)|
|1.1.3|Changes default hostname to `undefined`|
|1.1.2|Performance testing, `--silent`|
||`case-sensitive` option in **file** handler|
|1.1.1|[`require('reserve/mock')`](#mocking)|
||[`colors`](https://www.npmjs.com/package/colors) and [`mime`](https://www.npmjs.com/package/mime) are no more dependencies|
|1.0.5|`watch` option in **custom** handler|
|1.0.0|Initial version|

