# `send` helper

```typescript
interface SendOptions {
  statusCode?: number /* defaulted to 200 */
  headers?: Headers
  noBody?: boolean /* do not send body */
}

function send (response: ServerResponse, data?: string | object | ReadableStream, options?: SendOptions): Promise<void>
```

REserve offers a way to easily build responses : `statusCode` and `headers` can be specified, `noBody` prevents the body sending.

Headers are defaulted *(if not set)* depending on the `data` type :
* `string` :
  * `content-type` is set to `text/plain`
  * `content-length` is set computed a text encoder
* `object` :
  * `content-type` is set to `application/json`
  * `content-length` is set using a text encoder
