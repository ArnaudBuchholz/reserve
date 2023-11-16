# REserve/**cache**
cache handler for [REserve](https://npmjs.com/package/reserve).

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
