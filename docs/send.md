# `send` helper

```typescript
interface SendOptions {
  statusCode?: number /* defaulted to 200 */
  headers?: Headers
  noBody?: boolean /* do not send body */
}

function send (response: ServerResponse, data?: string | object | ReadableStream, options?: SendOptions): Promise<void>
```

REserve offers a way to easily build responses : `statusCode` and `headers` can be specified, `noBody` will prevent the body sending.

Headers can be defaulted depending on the `data` type :
* `string` :
  * `content-type` is set to `text/plain`
  * `content-length` is set computed a text encoder
* `object` :
  * `content-type` is set to `application/json`
  * `content-length` is set using a text encoder

**NOTE** : if `content-type` and `content-length` are defined in the options' headers, they are **not** overridden.
