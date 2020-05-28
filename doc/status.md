# `status` handler

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
| `headers` | Object | `{}` | Additional response headers *(capturing groups can be used as substitution parameters in values)* |