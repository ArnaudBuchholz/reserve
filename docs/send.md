# `send` helper

[🔝 REserve documentation](README.md)

REserve offers a way to **build** responses : 

* `statusCode` and `headers` *may* be specified,
* `noBody` prevents the body sending.

```typescript
interface SendOptions {
  statusCode?: number /* defaulted to 200 */
  headers?: Headers
  noBody?: boolean /* do not send body */
}

function send (response: ServerResponse, data: ReadableStream, options?: SendOptions): Promise<void>
function send (response: ServerResponse, data?: string | object, options?: SendOptions): void
```

> Types definition for `send`

Headers are defaulted *(if not set)* depending on the `data` type :
* `string` :
  * `content-type` is set to `text/plain`
  * `content-length` is calculated based on the UTF-8 encoding byte length
* `object` :
  * `content-type` is set to `application/json`
  * `content-length` is calculated based on the UTF-8 encoding byte length
* `ReadableStream` : not set
