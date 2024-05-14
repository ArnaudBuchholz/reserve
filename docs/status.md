# `status` handler

[🔝 REserve documentation](README.md)

**Ends** the request with a given status.

```json
{
  "match": "^/private/.*",
  "status": 403
}
```

> Example of a `status` mapping

## Features

* Supports [all HTTP methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)

* Accepts only numbers

* Also used when an internal redirection to a number occurs

* Capturing groups can be used in the headers' values

* End the response with the given status and, if defined, with a textual body :

| status | message |
|---|---|
| 403 | Forbidden |
| 404 | Not found |
| 405 | Method Not Allowed |
| 500 | Internal Server Error |
| 501 | Not Implemented |
| 508 | Loop Detected |

## Options

| option | type | default | description |
|---|---|---|---|
| `headers` | `object` | `{}` | Additional response headers *(capturing groups can be used as substitution parameters in values)* |