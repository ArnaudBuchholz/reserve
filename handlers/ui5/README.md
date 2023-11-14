# REserve/**ui5**
UI5 resources handler for [REserve](https://npmjs.com/package/reserve).

[![Package Quality](https://npm.packagequality.com/shield/reserve-ui5.svg)](https://packagequality.com/#?package=reserve-ui5)
[![Known Vulnerabilities](https://snyk.io/test/github/ArnaudBuchholz/reserve-ui5/badge.svg?targetFile=package.json)](https://snyk.io/test/github/ArnaudBuchholz/reserve-ui5?targetFile=package.json)
[![dependencies Status](https://david-dm.org/ArnaudBuchholz/reserve-ui5/status.svg)](https://david-dm.org/ArnaudBuchholz/reserve-ui5)
[![devDependencies Status](https://david-dm.org/ArnaudBuchholz/reserve-ui5/dev-status.svg)](https://david-dm.org/ArnaudBuchholz/reserve-ui5?type=dev)
[![REserve/UI5](https://badge.fury.io/js/reserve-ui5.svg)](https://www.npmjs.org/package/reserve-ui5)
[![REserve/UI5](http://img.shields.io/npm/dm/reserve-ui5.svg)](https://www.npmjs.org/package/reserve-ui5)
[![install size](https://packagephobia.now.sh/badge?p=reserve-ui5)](https://packagephobia.now.sh/result?p=reserve-ui5)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Usage

```json
{
  "handlers": {
    "ui5": "reserve-ui5"
  },
  "mappings": [{
    "ui5": true
  }]
}
```

## Supported verbs

### GET, HEAD

The handler intercepts all `GET` and `HEAD` requests done with a url containing `/resources/` or `/test-resources/` and serve them based on a UI5 CDN.

## Options

| Option | Default Value | Explanation |
|---|---|---|
| `version` | `'latest'` | Several values accepted, see below |
| `cache` | `''` | Cache UI5 resources locally in the given folder *(empty means disabled)* |
| `libs` | `{}` | Folder(s) containing dependent libraries, see below |

### `version`

### `libs`