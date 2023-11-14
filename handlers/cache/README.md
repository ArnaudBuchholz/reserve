# REserve/**cache**
cache handler for [REserve](https://npmjs.com/package/reserve).

[![Travis-CI](https://travis-ci.org/ArnaudBuchholz/reserve-cache.svg?branch=master)](https://travis-ci.org/ArnaudBuchholz/reserve-cache#)
[![Coverage Status](https://coveralls.io/repos/github/ArnaudBuchholz/reserve-cache/badge.svg?branch=master)](https://coveralls.io/github/ArnaudBuchholz/reserve-cache?branch=master)
[![Maintainability](https://api.codeclimate.com/v1/badges/db4a65b788857cd2730b/maintainability)](https://codeclimate.com/github/ArnaudBuchholz/reserve-cache/maintainability)
[![Package Quality](https://npm.packagequality.com/shield/reserve-cache.svg)](https://packagequality.com/#?package=reserve-cache)
[![Known Vulnerabilities](https://snyk.io/test/github/ArnaudBuchholz/reserve-cache/badge.svg?targetFile=package.json)](https://snyk.io/test/github/ArnaudBuchholz/reserve-cache?targetFile=package.json)
[![dependencies Status](https://david-dm.org/ArnaudBuchholz/reserve-cache/status.svg)](https://david-dm.org/ArnaudBuchholz/reserve-cache)
[![devDependencies Status](https://david-dm.org/ArnaudBuchholz/reserve-cache/dev-status.svg)](https://david-dm.org/ArnaudBuchholz/reserve-cache?type=dev)
[![reserve](https://badge.fury.io/js/reserve-cache.svg)](https://www.npmjs.org/package/reserve-cache)
[![reserve](http://img.shields.io/npm/dm/reserve-cache.svg)](https://www.npmjs.org/package/reserve-cache)
[![install size](https://packagephobia.now.sh/badge?p=reserve-cache)](https://packagephobia.now.sh/result?p=reserve-cache)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Usage

```json
{
  "handlers": {
    "cache": "reserve-cache"
  },
  "mappings": [{
    "match": "\\/cache\\/(.*)",
    "cache": "$1"
  }]
}
```

## Supported verbs

### GET

Retrieves a value, returns `204` if no value.

### POST

Stores or updates a value, returns `201` if new value.

### DELETE

Deletes a value.
