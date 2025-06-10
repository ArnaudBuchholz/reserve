# Configuration interface

[🔝 REserve documentation](README.md)

```TypeScript
interface IConfiguration {
  readonly handlers: { [key in string]?: readonly Handler }
  readonly mappings: (readonly Mapping)[]
  readonly http2: boolean
  readonly protocol: 'http' | 'https'
  setMappings: (mappings: Mapping[], request: IncomingMessage, timeout?: number) => Promise<void>
  dispatch: (request: IncomingMessage, response: ServerResponse) => Promise<void>
}
```

> Types definitions for `IConfiguration`

## Properties

The configuration interface exposes **read-only** properties.

### `handlers`

Returns the dictionary of **handlers** indexed by their **prefix**.

### `mappings`

Returns the list of **mappings** *(array of objects)*.

Adding or removing mappings to the returned list, does **not** modify the current list : use [`setMappings`](#methods) for that purpose.

However, it is still possible to **modify the mappings' content**. It is recommended to be **extremely careful** when manipulating them, since you might **break** the logic of the server.

### `protocol`

Returns the current protocol being served :

* `'http'`
* `'https'`

### `http2`

Returns a boolean indicating if the server implements [HTTP/2](https://en.wikipedia.org/wiki/HTTP/2).

## Methods

### `async setMappings (mappings, request, timeout = 5000)`

To **safely change** the list of mappings use the [asynchronous](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) `setMappings` method.

This API requires two parameters :

* the **new list** of mappings *(array of objects)*
* the **current request**

An optional third numeric parameter can be used to specify a timeout *(in ms, default `5000`)* after which the API fails *(usefull to detect blocking situations, see [#39](https://github.com/ArnaudBuchholz/reserve/issues/39))*

The API will:

* **validate** any new mapping *(relies on an internal detection mechanism based on symbols)*,
* **wait** for all pending requests to be completed before applying the new mappings *(any new incoming request is put on hold in the meantime)*.<br>The current request is **not** waited on *(because it is waiting on the `setMappings` call)*.

> [!CAUTION]
> If the server implements [server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) or any blocking request, this could lead to an **infinite waiting time**. To ignore such requests, use the mapping setting [`exclude-from-holding-list`](configuration.md#exclude-from-holding-list).

### `async dispatch (request, response)`

This API gives an **internal** access to the [dispatcher component](technical%20details.md#dispatcher). It takes a **request** and a **response**. Requests being processed through this API are flagged as `internal`.

The parameters can be initialized using the internal mock helpers :
```javascript
const { Request, Response } = require('reserve')
```

* Instantiate the `Request` class to simulate an incoming request, it supports two different signatures :

  * `(method, url, headers = {}, body = '', properties = undefined)`
  * `({ method, url, headers = {}, body = '', properties = undefined})`

* Instantiate the `Response` class to receive the dispatched response

For instance, it can be used to implement **batch requests** that are split into individual requests to be processed internally.

```javascript
const { body, Request, Response, send } = require('reserve')

module.exports = async function batchRequest (request, response) {
  const requests = await body(request).json()
  const promises = requests.map(url => {
    const batchRequest = new Request('GET', url)
    Object.keys(request.headers).forEach(header => {
      batchRequest.headers[header] = request.headers[header]
    })
    const batchResponse = new Response()
    return this.configuration.dispatch(batchRequest, batchResponse)
      .then(() => JSON.parse(batchResponse.toString()))
  })
  return Promise.all(promises)
    .then(results => send(response, results))
}
```

> Example of batch request processing

Another example is the implementation of [HTTP/2](https://en.wikipedia.org/wiki/HTTP/2) push mechanism.

```javascript
function push (configuration, path, response) {
  response.createPushResponse({
    ':method': 'GET',
    ':path': path
  }, (err, res) => {
    if (!err) {
      configuration.dispatch(new Request('GET', path), res)
    }
  })
}
```

> HTTP/2 push mechanism implementation
