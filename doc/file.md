# `file` handler

Answers the request using **file system**.

Example :
```json
{
  "match": "^/(.*)",
  "file": "./$1"
}
```

* Only supports [GET](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/GET)
* Capturing groups can be used as substitution parameters
* Absolute or relative to the handler's `cwd` member *(see [mappings](configuration.md#mappings))*
* Incoming URL parameters are automatically stripped out to simplify the matching expression
* Directory access is internally redirected to the inner `index.html` file *(if any)* or `404` status
* File access returns `404` status if missing or can't be read
* Mime type computation is based on [`mime`](https://www.npmjs.com/package/mime) **if installed**. Otherwise a limited subset of mime types is used:

|Extension|mime type|
|---|---|
|bin|application/octet-stream|
|css|text/css|
|gif|image/gif|
|html|text/html|
|htm|text/html|
|jpeg|image/jpeg|
|jpg|image/jpeg|
|js|application/javascript|
|pdf|application/pdf|
|png|image/png|
|svg|image/svg+xml|
|text|text/plain|
|txt|text/plain|
|xml|application/xml|

| option | type | default | description |
|---|---|---|---|
| `case-sensitive` | Boolean | `false` | *(for Windows)* when `true`, the file path is tested case sensitively. Since it has an impact on **performances**, use carefully. |
| `ignore-if-not-found` | Boolean | `false` | If the mapping does not resolve to a file or a folder, the handler does not end the request with status `404`. |

