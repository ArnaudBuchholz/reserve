# REserve/**ui5**
UI5 resources handler for [REserve](https://npmjs.com/package/reserve).

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