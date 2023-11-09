# `body` helper

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

REserve offers a **basic** method to **deserialize the request body**.

```javascript
const { body } = require('reserve')

async function customHandler (request, response) {
  const requestBody = await body(request).json()
  /* ... */
}
```

Depending on the request's `content-type` *(if set)*, `body()` will automatically return :
* a string when `text/plain`
* an object when `application/json`
* a [Buffer]() otherwise

**NOTE** : if the request's `content-length` is set (and not ignored), the buffer is allocated accordingly meaning the result might be truncated (if too small) or padded with `\x00` (if too large).