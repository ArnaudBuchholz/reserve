# `body` helper

[🔝 REserve documentation](README.md)

REserve offers a method to **deserialize a request body**.

```typescript
interface BodyOptions {
  ignoreContentLength?: boolean
}

type BodyResult = Promise<Buffer | string | object> & {
  buffer: () => Promise<Buffer>
  text: () => Promise<string>
  json: () => Promise<object>
}

function body (request: IncomingMessage, options?: BodyOptions): BodyResult
```

> Types definition for `body`

```javascript
import { body } from 'reserve'

async function customHandler (request, response) {
  const requestBody = await body(request).json()
  /* ... */
}
```

> Example of `body`

The return of `await body(request)` depends on the request headers.

If the `content-type` is specified and starts with :

* `text/plain` : a `string` is returned
* `application/json` : an `object` is returned _(after applying [`JSON.parse`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse) on the request content)_.
* Otherwise, a [`Buffer`](https://nodejs.org/docs/latest/api/buffer.html) is returned

It is possible to force the return type using :

* `await body(request).text()` : a `string` is returned
* `await body(request).json()` : an `object` is returned
* `await body(request).buffer()` : a [`Buffer`](https://nodejs.org/docs/latest/api/buffer.html) is returned

> [!CAUTION]
> If the request's `content-length` is set *(and not ignored through the `ignoreContentLength` option)*, the buffer is allocated **accordingly**.
> 
> It means the result might be **truncated** *(if too small)* or **padded** with `\x00` *(if too large)*.