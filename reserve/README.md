# **RE**serve

[![Node.js CI](https://github.com/ArnaudBuchholz/reserve/actions/workflows/node.js.yml/badge.svg)](https://github.com/ArnaudBuchholz/reserve/actions/workflows/node.js.yml)
[![Coverage Status](https://coveralls.io/repos/github/ArnaudBuchholz/reserve/badge.svg?branch=master)](https://coveralls.io/github/ArnaudBuchholz/reserve?branch=master)
[![Package Quality](https://npm.packagequality.com/shield/reserve.svg)](https://packagequality.com/#?package=reserve)
[![Known Vulnerabilities](https://snyk.io/test/github/ArnaudBuchholz/reserve/badge.svg?targetFile=package.json)](https://snyk.io/test/github/ArnaudBuchholz/reserve?targetFile=package.json)
[![reserve](https://badge.fury.io/js/reserve.svg)](https://www.npmjs.org/package/reserve)
[![reserve](http://img.shields.io/npm/dm/reserve.svg)](https://www.npmjs.org/package/reserve)
[![install size](https://packagephobia.now.sh/badge?p=reserve)](https://packagephobia.now.sh/result?p=reserve)
[![PackagePhobia](https://img.shields.io/badge/%F0%9F%93%A6package-phobia-lightgrey)](https://packagephobia.com/result?p=reserve)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FArnaudBuchholz%2Freserve.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FArnaudBuchholz%2Freserve?ref=badge_shield)
[![Documentation](https://img.shields.io/badge/-documentation-blueviolet)](https://arnaudbuchholz.github.io/reserve/)
[![History](https://img.shields.io/badge/-history-blueviolet)](https://arnaudbuchholz.github.io/reserve/history.html)

A **lightweight** web server statically **configurable** with regular expressions.
It can also be **embedded** and **extended**.

# Rational

Initially started to build a local **development environment** where static files are served and resources can be fetched from remote repositories, this **tool** is **versatile** and can support different scenarios :
- A simple web server
- A reverse proxy to an existing server
- A server that aggregates several sources
- ...

By defining **an array of mappings**, one can decide how the server will process the requests. Each mapping associates **matching** criteria *(method selection, url matching using  
[regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp))* to a **handler** that will answer the request.

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

# Usage

## npm start

* Install the package with `npm install reserve`
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

## Embedded

It is possible to implement the server in an application using the `serve` export :

```javascript
// CommonJS syntax
const { check, serve } = require('reserve')
// ESM syntax
// import { check, serve } from 'reserve'

check({
  port: 8080,
  mappings: [{
    match: /^\/(.*)/,
    file: '$1'
  }]
})
  .then(configuration => {
    serve(configuration)
      .on('ready', ({ url }) => {
        console.log(`Server running at ${url}`)
      })
  })
```

The resulting object implements the [EventEmitter](https://nodejs.org/api/events.html) class and throws events with parameters, see [Server events](doc/events.md).
It also exposes a `close` method (returning a `Promise`) to shutdown the server.

The package also gives access to the configuration reader :

```javascript
// CommonJS syntax
const { read, serve } = require('reserve')
// ESM syntax
// import { read, serve } from 'reserve'

read('reserve.json')
  .then(configuration => {
    serve(configuration)
      .on('ready', ({ url }) => {
        console.log(`Server running at ${url}`)
      })
  })
```

And a default log output *(verbose mode will dump all redirections)* :

```javascript
// CommonJS syntax
const { log, read, serve } = require('reserve')
// ESM syntax
// import { log, read, serve } from 'reserve'

read('reserve.json')
  .then(configuration => {
    log(serve(configuration), /*verbose: */ true)
  })
```

# Complete documentation

Go to this [page](https://github.com/ArnaudBuchholz/reserve/tree/master/doc/README.md) to access documentation and articles about REserve.
