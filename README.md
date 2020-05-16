# **RE**serve

<table border="0" cellpadding="2" cellspacing="0">
    <tr>
        <td valign="top">
          <strong>RE</strong>
        </td>
        <td>
          <i>duced</i></br />
          <i>levant</i></br />
          <i>verse proxy</i><br />
          <i>gexp-based</i><br />
          <i>useable</i><br />
          <strong>serve</strong>
        </td>
    </tr>
</table>

[![Travis-CI](https://travis-ci.org/ArnaudBuchholz/reserve.svg?branch=master)](https://travis-ci.org/ArnaudBuchholz/reserve#)
[![Coverage Status](https://coveralls.io/repos/github/ArnaudBuchholz/reserve/badge.svg?branch=master)](https://coveralls.io/github/ArnaudBuchholz/reserve?branch=master)
[![Maintainability](https://api.codeclimate.com/v1/badges/49e3adbc8f31ae2febf3/maintainability)](https://codeclimate.com/github/ArnaudBuchholz/reserve/maintainability)
[![Package Quality](https://npm.packagequality.com/shield/reserve.svg)](https://packagequality.com/#?package=reserve)
[![Known Vulnerabilities](https://snyk.io/test/github/ArnaudBuchholz/reserve/badge.svg?targetFile=package.json)](https://snyk.io/test/github/ArnaudBuchholz/reserve?targetFile=package.json)
[![dependencies Status](https://david-dm.org/ArnaudBuchholz/reserve/status.svg)](https://david-dm.org/ArnaudBuchholz/reserve)
[![devDependencies Status](https://david-dm.org/ArnaudBuchholz/reserve/dev-status.svg)](https://david-dm.org/ArnaudBuchholz/reserve?type=dev)
[![reserve](https://badge.fury.io/js/reserve.svg)](https://www.npmjs.org/package/reserve)
[![reserve](http://img.shields.io/npm/dm/reserve.svg)](https://www.npmjs.org/package/reserve)
[![install size](https://packagephobia.now.sh/badge?p=reserve)](https://packagephobia.now.sh/result?p=reserve)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FArnaudBuchholz%2Freserve.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FArnaudBuchholz%2Freserve?ref=badge_shield)

A **lightweight** web server statically **configurable** with regular expressions.
It can also be **embedded** and **extended**.

# Rational

Initially started to build a local **development environment** where static files are served and resources can be fetched from remote repositories, this **tool** is **versatile** and can support different scenarios :
- A simple web server
- A reverse proxy to an existing server
- A server that aggregates several sources
- ...

By defining **an array of mappings**, one can decide how the server will process the requests. Each mapping associates a **matching** criterion defined with a
[regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp) to a **handler** that will answer the request.

The configuration syntax favors **simplicity** without dropping flexibility.

For instance, the definition of a server that **exposes files** of the current directory but **forbids access** to the directory `private` consists in :

```json
{
  "port": 8080,
  "mappings": [{
    "match": "^/private/.*",
    "status": 403
  }, {
    "match": "^/(.*)",
    "file": "./$1"
  }]
}
```

## More documentation

Go to this [page](https://github.com/ArnaudBuchholz/reserve/tree/master/doc/README.md) to access articles about REserve.

# Usage

## In a project

* Install the package with `npm install reserve` *(you decide if you want to save it as development dependency or not)*
* You may create a start script in `package.json` :

```json
{
  "scripts": {
    "start": "reserve"
  }
}
```

* By default, it will look for a file named `reserve.json` in the current working directory
* A configuration file name can be specified using `--config <file name>`, for instance :

```json
{
  "scripts": {
    "start": "reserve",
    "start-dev": "reserve --config reserve-dev.json"
  }
}
```

## Global

* Install the package with `npm install reserve --global`
* Run `reserve`
  * By default, it will look for a file named `reserve.json` in the current working directory
  * A configuration file name can be specified using `--config <file name>`

**NOTE** : if [`process.send`](https://nodejs.org/api/process.html#process_process_send_message_sendhandle_options_callback) is defined, REserve will notify the parent process when the server is ready by sending the message `'ready'`.

# Embedding

It is possible to implement the server in any application using the `reserve/serve` module :

```javascript
const path = require('path')
const reserve = require('reserve/serve')
reserve({
  port: 8080,
  mappings: [{
    match: /^\/(.*)/,
    file: path.join(__dirname, '$1')
  }]
})
  .on('ready', ({ url }) => {
      console.log(`Server running at ${url}`)
  })
```

The resulting object implements the [EventEmitter](https://nodejs.org/api/events.html) class and throws the following events with parameters :

| Event | Parameter *(object containing members)* | Description |
|---|---|---|
| **server-created** | `server` *([`http.server`](https://nodejs.org/api/http.html#http_class_http_server) or [`https.server`](https://nodejs.org/api/https.html#https_class_https_server))*, `configuration` *([configuration interface](#configuration-interface))*| Only available to `listeners`, this event is triggered after the HTTP(S) server is **created** and **before it accepts requests**.
| **ready** | `url` *(String, example : `'http://0.0.0.0:8080/'`)*| The server is listening and ready to receive requests, hostname is replaced with `0.0.0.0` when **unspecified**.
| **incoming** | `method` *(String, example : `'GET'`)*, `url` *(String)*, `start` *(Date)* | New request received, these parameters are also transmitted to **error**, **redirecting** and **redirected** events |
| **error** | `reason` *(Any)* | Error reason, contains **incoming** parameters if related to a request |
| **redirecting** | `type` *(Handler type, example : `'status'`)*, `redirect` *(String or Number, example : `404`)* | Processing redirection to handler, gives handler type and redirection value. <br />*For instance, when a request will be served by the [file handler](#file), this event is generated once. But if the requested resource does not exist, the request will be redirected to the [status](#status) 404 triggering again this event.* |
| **redirected** | `end` *(Date)*, `timeSpent` *(Number of ms)*, `statusCode` *(Number)* | Request is fully processed. `timeSpent` is evaluated by comparing `start` and `end` (i.e. not using high resolution timers) and provided for information only. |

The package also gives access to the configuration reader :

```javascript
const path = require('path')
const { read } = require('reserve/configuration')
const reserve = require('reserve/serve')
read('reserve.json')
  .then(configuration => {
    reserve(configuration)
      .on('ready', ({ url }) => {
        console.log(`Server running at ${url}`)
      })
  })
```

And a default log output *(verbose mode will dump all redirections)* :

```javascript
const path = require('path')
const { read } = require('reserve/configuration')
const log = require('reserve/log')
const reserve = require('reserve/serve')
read('reserve.json')
  .then(configuration => {
    log(reserve(configuration), /*verbose: */ true)
  })
```

NOTE: log is using [`colors`](https://www.npmjs.com/package/colors) **if installed**.

# Configuration

## hostname *(optional)*

Used to set the `host` parameter when calling http(s) server's [listen](https://nodejs.org/api/net.html#net_server_listen).

Default is `undefined`.

## port *(optional)*

Used to set the `port` parameter when calling http(s) server's [listen](https://nodejs.org/api/net.html#net_server_listen).

Default is `5000`.

## max-redirect *(optional)*

Limits the number of internal redirections. If the number of redirections goes beyond the parameter value, the request fails with error [`508`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/508).

Default is `10`.

## ssl *(optional)*

This object provides certificate information to build an https server. You might be interested by the article [An Express HTTPS server with a self-signed certificate](https://flaviocopes.com/express-https-self-signed-certificate/).

The object must contain :
* `cert` : a relative or absolute path to the certificate file
* `key` : a relative or absolute path to the key file

If relative, the configuration file directory or the current working directory (when embedding) is considered.

## handlers

An object associating a handler prefix to a handler object.
If the property value is a string, the handler is obtained using  [require](https://nodejs.org/api/modules.html#modules_require_id).

For instance : every mapping containing the `cache` property will be associated to the [REserve/cache](https://www.npmjs.com/package/reserve-cache) handler.

```json
{
  "handlers": {
    "cache": "reserve-cache"
  }
}
```

**NOTE** : it is not possible to change the associations of the default prefixes (`custom`, `file`, `status`, `url`, `use`). **No error** will be thrown if a prefix collides with a predefined one.

See [Custom handlers](#custom-handlers) for more information.

## mappings

An array of mappings that is evaluated in the order of declaration.
* Several mappings may apply to the same request
* Evaluation stops when the request is **finalized** *(see the note below)*
* When a handler triggers a redirection, the array of mappings is re-evaluated

**NOTE** : REserve hooks the [`response.end`](https://nodejs.org/api/http.html#http_response_end_data_encoding_callback) API to detect when the response is finalized.

Each mapping must contain :
* `match` *(optional)* : a string (converted to a regular expression) or a regular expression that will be applied to the [request URL](https://nodejs.org/api/http.html#http_message_url), defaulted to `"(.*)"`
* `method` *(optional)* : a comma separated string or an array of [HTTP verbs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) that is matched with the [request method](https://nodejs.org/api/http.html#http_message_method), defaulted to `undefined` *(meaning all methods are allowed)*.
* the handler prefix (`custom`, `file`, `status`, `url`, `use` ...) which value may contain capturing groups *(see [Custom handlers](#custom-handlers))*
* `cwd` *(optional)* : the current working directory to consider for relative path, defaulted to the configuration file directory or the current working directory (when embedding)

**NOTE** : when using `custom` in a [JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON) file, since functions can't be used in this format, the expected value is a string referencing the relative or absolute module to load. If relative, the `cwd` member is considered.

**NOTE** : each **handler may provide its own `method` parameter** depending on which verbs are implemented. The mapping's `method` value **cannot** allow a verb that is not implemented. As a consequence **an error is thrown** if the combination of handler and mapping `method` parameters leads to an empty list.

For instance :

* `reserve.json` :

```json
{
  "port": 8080,
  "mappings": [{
    "custom": "./cors"
  }, {
    "match": "^/(.*)",
    "file": "./$1"
  }]
}
```

* `cors.js` :

```javascript
module.exports = async (request, response) => response.setHeader('Access-Control-Allow-Origin', '*')
```

## listeners

An array of **functions** or **module names exporting a function** which will be called with the **REserve [EventEmitter](https://nodejs.org/api/events.html) object**. The purpose is to allow events registration before the server starts and give access to the `server-created` event.

## extend

*Only for JSON configuration*

A relative or absolute path to another configuration file to extend.
If relative, the current configuration file directory is considered.

The current settings overwrite the ones coming from the extended configuration file.

Extended `mappings` are imported at the end of the resulting array, making the current ones being evaluated first. This way, it is possible to override the extended mappings.

# Handlers

## file

Answers the request using **file system**.

Example :
```json
{
  "match": "^/(.*)",
  "file": "./$1"
}
```

* Only supports [GET](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/GET)
* Capturing groups can be used as substitution parameters
* Absolute or relative to the handler's `cwd` member *(see [mappings](#mappings))*
* Incoming URL parameters are automatically stripped out to simplify the matching expression
* Directory access is internally redirected to the inner `index.html` file *(if any)* or `404` status
* File access returns `404` status if missing or can't be read
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

## url

Answers the request by **forwarding** it to a different URL.

Example :
```json
{
  "match": "^/proxy/(https?)/(.*)",
  "url": "$1://$2",
  "unsecure-cookies": true
}
```

* Supports [all HTTP methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)
* Capturing groups can be used as substitution parameters
* Redirects to any URL (http or https)

**NOTE** : It must redirect to an absolute URL

| option | type | default | description |
|---|---|---|---|
| `unsecure-cookies` | Boolean | `false` | when `true`, the secured cookies are converted to unsecure ones. Hence, the browser will keep them even if not running on https |
| `forward-request` | String or Function | - | when specified, the function is called **before** generating the forward request. The expected signature is  `function ({ configuration, context, mapping, match, request: { method, url, headers }})`. Changing the request settings will **impact** the forward request.
| `forward-response` | String or Function | - | when specified, the function is called **after** sending the forward request but **before** writing the current request's response. The expected signature is `function ({ configuration, context, mapping, match, headers })`. Changing the headers will directly impact the current request's response.

**NOTE** : When a string is used for `forward-request` or `forward-response`, the corresponding function is loaded with [require](https://nodejs.org/api/modules.html#modules_require_id).

**NOTE** : The `context` parameter is a unique object *(one per request)* allocated to link the `forward-request` and `forward-response` callbacks. It enables **request-centric communication** between the two: whatever members you add on it during the `forward-request` callback will be kept and transmitted to the `forward-response` callback.

## custom

Enables 'simple' **custom** handlers.

Examples :
```javascript
{
  custom: async (request, response) => response.setHeader('Access-Control-Allow-Origin', '*')
}
```

Or using an external module :

```javascript
{
  custom: './cors.js'
}
```

with `cors.js` :
```javascript
module.exports = async (request, response) => response.setHeader('Access-Control-Allow-Origin', '*')
```

External modules are loaded with Node.js [require](https://nodejs.org/api/modules.html#modules_require_id) API.

`custom` must point to a [function](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Functions)
* That takes at least two parameters : [`request`](https://nodejs.org/api/http.html#http_class_http_incomingmessage) and [`response`](https://nodejs.org/api/http.html#http_class_http_serverresponse)
* Capturing groups' values are passed as additional parameters.
* This function must return a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
* If the promise is resolved to a value (i.e. not `undefined`), an internal redirection occurs i.e. the request is going over the mappings again (*infinite loops are now prevented, see `max-redirect`*).
* If the `response` is not **finalized** after executing the function *(i.e. [`response.end`](https://nodejs.org/api/http.html#http_response_end_data_encoding_callback) was not called)*, the `request` is going over the remaining mappings

| option | type | default | description |
|---|---|---|---|
| `watch` | Boolean | `false` | when `true` and using a local module *(does not work with `node_modules`)* the file's modified time is checked before executing the handler. When changed, the module is reloaded |

## status

**Ends** the request with a given status.

Example :
```json
{
  "match": "^/private/.*",
  "status": 403
}
```

* Supports [all HTTP methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)
* Accepts only Numbers
* Also used when an internal redirection to a Number occurs
* Capturing groups can be used in the headers' values
* End the response with the given status and, if defined, with a textual message :

| status | message |
|---|---|
| 403 | Forbidden |
| 404 | Not found |
| 405 | Method Not Allowed |
| 500 | Internal Server Error |
| 501 | Not Implemented |
| 508 | Loop Detected |

| option | type | default | description |
|---|---|---|---|
| `headers` | Object | `{}` | Additional response headers (capturing groups can be used as substitution parameters in values) |

## use

Enables the use of [express middleware functions](https://www.npmjs.com/search?q=keywords%3Aexpress%20keywords%3Amiddleware).

**NOTE** : Supports only middleware functions accepting exactly three parameters (`request`, `response` and `next`) as described [here](http://expressjs.com/en/guide/writing-middleware.html).

**NOTE** : This is an **experimental feature** that needs deeper testing.

Example :

```json
{
  "use": "express-session",
  "options" : {
    "secret": "keyboard cat",
    "resave": false,
    "saveUninitialized": true
  }
}
```

| option | type | default | description |
|---|---|---|---|
| `options` | Object | `{}` | Options passed to the middleware factory |

## Other handlers

The following handlers can be installed separately and plugged through the `handlers` configuration property.

| handler | description |
|---|---|
| [REserve/cache](https://www.npmjs.com/package/reserve-cache) | Caches string in memory |
| [REserve/cmd](https://www.npmjs.com/package/reserve-cmd) | Wraps command line execution |
| [REserve/fs](https://www.npmjs.com/package/reserve-fs) | Provides [fs](https://nodejs.org/api/fs.html) APIs to the browser |

## Custom handlers

A custom handler object may define:

* **schema** *(optional)* a mapping validation schema, see [below](#schema) for the proposed syntax

* **method** *(optional)* a comma separated string or an array of [HTTP verbs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) that indicates which methods are implemented. When no value is provided, REserve considers that any verb is supported.

* **validate** *(optional)* an [asynchronous](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) method that validates mapping definition, it will be called with two **parameters**:
  - **mapping** the mapping being validated
  - **configuration** the [configuration interface](#configuration-interface)


* **redirect** *(mandatory)* an [asynchronous](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) method that will be called with an **object** exposing:
  - **configuration** the [configuration interface](#configuration-interface)
  - **mapping** the mapping being executed
  - **match** the regular expression [exec result](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec)
  - **redirect** the value associated with the handler prefix in the mapping. Capturing groups **are** substituted.
  - **request** Node.js' [http.IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage)
  - **response** Node.js' [http.ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse)

### Capturing groups and interpolation

By default, the handler prefix is **interpolated**. Identified **placeholders are substituted** with values coming from the capturing groups of the matching regular expression.

Three syntaxes are accepted for placeholders, `<index>` represents the capturing group index in the regular expression (1-based):
* `$<index>` value is replaced **as-is**
* `$&<index>` value is first **decoded** with [decodeURI](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURI)
* `$%<index>` value is first **decoded** with [decodeURIComponent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent)

When writing an handler, it is possible to **reuse the mechanism** by importing the function `require('reserve').interpolate`. It accepts two parameters:
* **match** the regular expression [exec result](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec)
* **value** accepting multiple types :
  - `string` : value is interpolated and the result returned
  - `object` : property values are interpolated **recursively** and a new object is returned
  - otherwise the value is returned **as-is**

### Schema

The schema syntax is designed to be short and self-explanatory. It is a dictionary mapping a property name to its specification.

It can be either:
* Simple type specification (for instance: `"string"`)
* Multiple types specification (for instance `["function", "string"]`)
* Complete specification: an object containing `type` (or `types`) and a `defaultValue` for optional properties.

For instance, the following schema specification defines:
* a **mandatory** `custom` property that must be either a `function` or a `string`
* an **optional** `watch` boolean property which default value is `false`

```json
{
  "schema": {
    "custom": ["function", "string"],
    "watch": {
      "type": "boolean",
      "defaultValue": false
    }
  }
}
```

If provided, the schema is applied on the mapping **before** the **validate** function.

### Configuration interface

The configuration interface lets you access the dictionary of handlers (member `handlers`) as well as the array of existing mappings (member `mappings`).

It is recommended to be extremely careful when manipulating the mappings' content, since you might break the logic of the server.

It is possible to safely change the list of mapping using the [asynchronous](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) `setMappings` method. This API takes two parameters: the new list of mappings and the current request.

The API will:
* validate any new mapping *(relies on an internal detection mechanism based on symbols)*
* wait for all pending requests to be completed before applying the new list

# Helpers

## body

Since version 1.4.0, the package offers a **basic** method to **read the request body**.

```javascript
const { body } = require('reserve')

async function customHandler (request, response) {
  const requestBody = JSON.parse(await body(request))
  /* ... */
}
```

# Mocking

Since version 1.1.0, the package includes the helper `reserve/mock` to build tests. This method receives a configuration (like `reserve/serve`) and returns a promise resolving to an [EventEmitter](https://nodejs.org/api/events.html)  augmented with a `request` method :

```javascript
function request (method, url, headers = {}, body = '') {
  return Promise.resolve(mockedResponse)
}
```

Call the `request` method to simulate an incoming request, it returns a promise resolving to a mocked response exposing the following members :

| Member | Type | Description |
|---|---|---|
| **headers** | Object | Response headers
| **statusCode** | Number | Status code
| **finished** | Boolean | `true`
| **toString()** | String | Gives the response body

Example :

```javascript
require('reserve/mock')({
  port: 8080,
  mappings: [{
    match: /^\/(.*)/,
    file: path.join(__dirname, '$1')
  }]
})
  .then(mocked => mocked.request('GET', '/'))
  .then(response => {
    assert(response.statusCode === 200)
    assert(response.toString() === '<html />')
  })
```

You may provide mocked handlers *(based on their [actual implementation](https://github.com/ArnaudBuchholz/reserve/tree/master/handlers))*:

```javascript
require('reserve/mock')({
  port: 8080,
  mappings: [{
    match: /^\/(.*)/,
    file: path.join(__dirname, '$1')
  }]
}, {
  file: {
    redirect: async ({ request, mapping, redirect, response }) => {
      if (redirect === '/') {
        response.writeHead(201, {
          'Content-Type': 'text/plain',
          'Content-Length': 6
        })
        response.end('MOCKED')
      } else {
        return 500
      }
    }
  }
})
  .then(mocked => mocked.request('GET', '/'))
    .then(response => {
      assert(response.statusCode === 201)
      assert(response.toString() === 'MOCKED')
    })
```

# Version history

|Version|content|
|---|---|
|1.0.0|Initial version|
|1.0.5|`watch` option in **custom** handler|
|1.1.1|[`require('reserve/mock')`](#mocking)|
||[`colors`](https://www.npmjs.com/package/colors) and [`mime`](https://www.npmjs.com/package/mime) are no more dependencies|
|1.1.2|Performance testing, `--silent`|
||`case-sensitive` option in **file** handler|
|1.1.3|Changes default hostname to `undefined`|
|1.1.4|Enables external handlers in `json` configuration through [require](https://nodejs.org/api/modules.html#modules_require_id)|
|1.1.5|Fixes relative path use of external handlers in `json` configuration|
|1.1.6|Improves response mocking (`flushHeaders()` & `headersSent`)|
|1.1.7|Compatibility with Node.js >= 12.9|
||Improves response mocking|
|1.2.0|Implements handlers' schema|
||Gives handlers access to a configuration interface|
||Prevents infinite loops during internal redirection (see `max-redirect`)|
|1.2.1|Fixes coloring in command line usage|
|1.3.0|Fixes infinite loop in the error handler|
||Adds experimental `use` handler for [express middleware functions](https://www.npmjs.com/search?q=keywords%3Aexpress%20keywords%3Amiddleware)|
||Makes the mapping `match` member optional|
|1.4.0|More [documentation](https://github.com/ArnaudBuchholz/reserve/tree/master/doc/README.md) |
||Exposes simple body reader (`require('reserve').body`)|
||Adds `method` specification *(handlers & mappings)*|
|1.5.0|`headers` option in **status** handler *(enables HTTP redirect)*|
||`ignore-if-not-found` option in **file** handler *(enables folder browsing with a separate handler)*|
|1.6.0|Implements `$%1` and `$&1` substitution parameters *(see [Custom handlers](#custom-handlers))*|
|1.6.1|Exposes `require('reserve').interpolate` *(see [Custom handlers](#custom-handlers))*|
|1.7.0|Adds `listeners` configuration option|
||Adds `server-created` event available only to listeners|
||Secures events processing against exceptions|
||Adds `forward-request` and `forward-response` options for the `url` handler|
|1.7.1|Adds more context to `forward-request` and `forward-response` callbacks|
|1.7.2|Improves end of streaming detection in `file` and `url` handlers|
||`capture` helper (experimental)|
||`custom` handler validation *(improved)*|
