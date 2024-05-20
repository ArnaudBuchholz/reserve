<p align="center">
  <img src="https://arnaudbuchholz.github.io/gfx/REserve.png" alt="REserve logo" width="300px"/>
</p>

# REserve 2️⃣

[![Node.js CI](https://github.com/ArnaudBuchholz/reserve/actions/workflows/reserve-ci.yml/badge.svg)](https://github.com/ArnaudBuchholz/reserve/actions/workflows/node.js.yml)
![no dependencies](https://img.shields.io/badge/-no_dependencies-green)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Package Quality](https://npm.packagequality.com/shield/reserve.svg)](https://packagequality.com/#?package=reserve)
[![Known Vulnerabilities](https://snyk.io/test/github/ArnaudBuchholz/reserve/badge.svg?targetFile=package.json)](https://snyk.io/test/github/ArnaudBuchholz/reserve?targetFile=package.json)
[![reserve](https://badge.fury.io/js/reserve.svg)](https://www.npmjs.org/package/reserve)
[![install size](https://packagephobia.now.sh/badge?p=reserve)](https://packagephobia.now.sh/result?p=reserve)
[![PackagePhobia](https://img.shields.io/badge/%F0%9F%93%A6package-phobia-lightgrey)](https://packagephobia.com/result?p=reserve)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FArnaudBuchholz%2Freserve.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FArnaudBuchholz%2Freserve?ref=badge_shield)
[![Documentation](https://img.shields.io/badge/-documentation-blueviolet)](https://github.com/ArnaudBuchholz/reserve/blob/main/docs/README.md)
[![History](https://img.shields.io/badge/-history-blueviolet)](https://github.com/ArnaudBuchholz/reserve/blob/main/reserve/CHANGELOG.md)

> A **lightweight** web server **configurable** with regular expressions. It can also be **embedded** and **extended**. The name comes from the combination of `RE` for regular expressions and `serve`.

# 🍁 Rational

Initially started to build a local **development environment** where static files are served and resources can be fetched from remote repositories, this **tool** is **versatile** and can support different scenarios :
- A simple web server,
- A reverse proxy,
- A server that aggregates several sources,
- ...

By defining **an array of mappings**, one can decide how the server will process the incoming requests. Each mapping associates **matching** criteria *(method selection, url matching using 
[regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp))* to a **handler** that will answer the request.

The configuration syntax favors **simplicity** without dropping flexibility.

For instance, the definition of a server that **exposes files** of the current directory but **forbids access** to the directory `private` consists in :

```json
{
  "port": 8080,
  "mappings": [{
    "match": "^/private/",
    "status": 403
  }, {
    "match": "^/(.*)",
    "file": "./$1"
  }, {
    "status": 404
  }]
}
```

> Example of `reserve.json` configuration file

# 💿 Usage

## Command line

The package declares the executable `reserve` :

* By default, it will look for a file named `reserve.json` in the current working directory
* One or more configuration files name can be specified using `--config <file names separated by ,>`

## Embedded

The server can be embedded in an application using the `serve` export :

```javascript
const { serve } = require('reserve')

serve({
  port: 8080,
  mappings: [{
    match: /^\/(.*)/,
    file: '$1'
  }, {
    "status": 404
  }]
})
  .on('ready', ({ url }) => {
    console.log(`Server running at ${url}`)
  })
```

> Embedding `reserve` in a custom application (CommonJS)

The resulting object exposes a method similar to the [EventEmitter::on method](https://nodejs.org/api/events.html#emitteroneventname-listener) and throws events with parameters, see [Server events](doc/events.md).
It also exposes a `close` method *(returning a `Promise` resolved when all pending requests are completed)* to shutdown the server.

The package also gives access to the configuration reader :

```javascript
import { read, serve } from 'reserve'

read('reserve.json')
  .then(configuration =>
    serve(configuration)
      .on('ready', ({ url }) => {
        console.log(`Server running at ${url}`)
      })
  )
```

> Embedding `reserve` in a custom application (ESM)

And a default log output *(verbose mode will dump all redirections)* :

```javascript
import { log, read, serve } from 'reserve'

read('reserve.json')
  .then(configuration =>
    log(serve(configuration), /*verbose: */ true)
  )
```

> Embedding `reserve` with the default logger (ESM)

# ⚖️ License

The package is licensed MIT and has **no** dependencies.

# 📚 Documentation

Go to this [page](https://github.com/ArnaudBuchholz/reserve/tree/master/docs/README.md) to access documentation and articles about REserve.

[⚠️ From v1 to v2](https://github.com/ArnaudBuchholz/reserve/tree/master/docs/v1_to_v2.md)
