# reserve

<table border="0" cellpadding="2" cellspacing="0">
    <tr>
        <td valign="top" style="border-right: 2px solid gray;">
          <strong>RE</strong>
        </td>
        <td>
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

A lightweight http(s) server statically configurable using regular expressions. It can also be embedded and extended.

# Usage

In the package.json:
```json
{
  " ... ": {},
  "scripts": {
      "start": "reserve"
  },
  "dependencies": {
    "reserve": "^1.0.0"
  }
}
```

Create a file named reserve.json in the root folder:
```json
{
  "port": 8080,
  "mappings": [{
    "match": "(.*)",
    "file": "./$1"
  }]
}
```

# Embedding

```javascript
const path = require('path')
const reserve = require('reserve/serve')
reserve({
  port: 8080,
  mappings: [{
    // mapping to file access
    match: /(.*)/,
    file: path.join(__dirname, '$1')
  }]
})
```
