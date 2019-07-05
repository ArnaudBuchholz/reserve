# reserve

<table border="0" cellpadding="2" cellspacing="0">
    <tr>
        <td valign="top">
          <strong>RE</strong>
        </td>
        <td>
          <i>levant</i></br />
          <i>verse proxy</i><br />
          <i>gexp-based</i><br />
          <i>useable</i><br />
          <strong>SERVE</strong>
        </td>
    </tr>
</table>

[![Travis-CI](https://travis-ci.org/ArnaudBuchholz/reserve.svg?branch=master)](https://travis-ci.org/ArnaudBuchholz/reserve#)
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

Initially started to build a local **development environment** where static files are served and resources can be fetched from remote repositories, this **tool** is **versatile** and can support different scenarios:
- A simple web server
- A reverse proxy to an existing server
- A server that aggregates several sources
- ...

By defining **an array of mappings**, one can decide how the server will process the requests. Each mapping associates a **matching** criteria defined with a
[regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp) to a **handler** that will answer the request.

The configuration syntax favors **simplicity** without dropping flexibility.

For instance, the definition of a server that **exposes files** of the current folder but **forbids access** to the folder `private` consists in:

```json
{
  "port": 8080,
  "mappings": [{
    "match": "/private/.*",
    "status": 403
  }, {
    "match": "/(.*)",
    "file": "./$1"
  }]
}
```

# Usage

* Install the package with `npm install reserve` *(you decide if you want to save it as development dependency or not)*
* You may create a start script in `package.json`:

```json
{
  "scripts": {
    "start": "reserve"
  }
}
```
* By default, **reserve** will look for a file named `reserve.json` in the current folder:

```json
{
  "port": 8080,
  "mappings": [{
    "match": "/(.*)",
    "file": "./$1"
  }]
}
```

* A configuration file name can be specified using `--config <file name>`, for instance:

```json
{
  "scripts": {
    "start": "reserve",
    "start-dev": "reserve --config reserve-dev.json"
  }
}
```

# Embedding

It is possible to implement the server in any application using the `reserve/serve` module:

```javascript
const path = require('path')
const reserve = require('reserve/serve')
reserve({
  port: 8080,
  mappings: [{
    match: /\/(.*)/,
    file: path.join(__dirname, '$1')
  }]
})
  .on('ready', ({ url }) => {
      console.log(`Server running at ${url}`)
  })
```

The resulting object implements the [EventEmitter](https://nodejs.org/api/events.html) class and throw the following events with parameters:

| Event | Parameter (object containing members) | Description |
|---|---|---|
| **ready** | url *(String, example: `'http://127.0.0.1:5002/'`)*| The server is listening and ready to receive requests
| **incoming** | method *(String, example: `'GET'`)*, url *(String)*, start *(Date)* | New request received, these parameters are also transmitted to **error**, **redirecting** and **redirected** events |
| **error** | reason *(Any)* | Error reason, contains **incoming** parameters if related to a request |
| **redirecting** | type *(Handler type, example: `'status'`)*, redirect *(String or Number, example: `403`)* | Processing redirection to handler, gives handler type and redirection value |
| **redirected** | end *(Date)*, timeSpent *(Number of ms)*, statusCode *(Number)* | Request is fully processed |

The package also gives access to the configuration reader:

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

And a default log output *(verbose mode will dump all redirections)*:

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

# Configuration

## hostname *(optional)*

Used to set the `host` parameter when calling http(s) server's [listen](https://nodejs.org/api/net.html#net_server_listen).

Default is `'127.0.01'`.

## port *(optional)*

Used to set the `port` parameter when calling http(s) server's [listen](https://nodejs.org/api/net.html#net_server_listen).

Default is `5000`.

## ssl *(optional)*

This object provides certificate information to build an https server. You might be interested by the article [An Express HTTPS server with a self-signed certificate](https://flaviocopes.com/express-https-self-signed-certificate/).

The object must contain:
* `cert`: a relative or absolute path to the certificate file
* `key`: a relative or absolute path to the key file

If relative, the configuration file folder or the current working folder (when embedding) is considered.

## mappings

An array of mappings that is evaluated in the order of declaration.

Each mapping must contain:
* `match`: a string (converted to a regular expression) or a regular expression that will be applied to the request URL
* the handler key (`custom`, `file`, `status`, `url` ...) which value may contain capturing groups *(see [handlers](#handlers))*
* `cwd` *(optional)*: the folder to consider for relative path, defaulted to the configuration file folder or the current working folder (when embedding)

**NOTE**: when using `custom` in a [JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON) file, since functions can't be used in this format, the expected value is a string referencing the relative or absolute module to load. If relative, the `cwd` member is considered.

For instance:

* `reserve.json`:

```json
{
  "port": 8080,
  "mappings": [{
    "match": ".*",
    "custom": "./cors"
  }, {
    "match": "/(.*)",
    "file": "./$1"
  }]
}
```

* `cors.js`:

```javascript
module.exports = (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*')
  return Promise.resolve()
}
```


## extend

*Only for JSON configuration*

A relative or absolute path to another configuration file to extend.
If relative, the current configuration file folder is considered.

The current settings always overwrite the ones coming from the extended configuration file.

The only exception is `mappings`.
Extended mappings are imported in a way that makes them have a lower priority than the current one.

Recursion is allowed but not secured (beware of loops).

# Handlers

## file

Redirect to local file, capturing groups can be used as substitution parameters.
Relative path are relative to the place where the JSON configuration file was read or the process working directory.

Folder access is redirected to the inner index.html file (if any) or 403
If the requested file is missing or can't be read, it returns 404

Mime type computation is based on [mime](https://www.npmjs.com/package/mime).

Example:

## url

Redirect to any URL (http or https), capturing groups can be used as substitution parameters.

Example:

### url Options

* `unsecure-cookies`: _(boolean)_ when true, the secured cookies are converted to unsecure ones.
Hence, the browser will keep them even if not running on https

## custom

It expects a function taking:
* request
* response

It must returns a Promise that resolves to:
* undefined
* any string: the request is redirected internally
* number: the request is terminated with the given status code

Capturing groups' values are passed as additional parameters.

When used in a json file, the value may point to a module that will be loaded with require. The result is expected to be the function.



## status
