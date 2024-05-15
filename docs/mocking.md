# Mocking

[🔝 REserve documentation](README.md)

From the beginning, REserve includes an **helper to build tests**.

```typescript
interface MockedResponse extends ServerResponse {
  toString: () => string
  waitForFinish: () => Promise<void>
  isInitial: () => boolean
  setAsynchronous: () => void
}

type MockedRequestDefinition = {
  method?: string,
  url: string,
  headers?: Headers,
  body?: string,
  properties?: object
}

interface MockServer extends Server {
  request: ((method: string, url: string) => Promise<MockedResponse>) &
    ((method: string, url: string, headers: Headers) => Promise<MockedResponse>) &
    ((method: string, url: string, headers: Headers, body: string) => Promise<MockedResponse>) &
    ((method: string, url: string, headers: Headers, body: string, properties: object) => Promise<MockedResponse>) &
    ((definition: MockedRequestDefinition) => Promise<MockedResponse>)
}

function mock (configuration: Configuration, mockedHandlers?: Handlers): Promise<MockServer>
```

> Types definitions for `mock`

## Mocking requests

The `mock` method accepts a **configuration** and returns a server object **augmented with a `request` method** to simulate incoming requests.

```javascript
const assert = require('assert')
const { mock, body, send } = require('reserve')

mock({
  mappings: [{
    method: 'POST',
    match: '/test',
    custom: async (request, response) => {
      const { name } = await body(request).json()
      return send(response, `Hello ${name} !`)
    }
  }]
})
  // Must wait for the mock to be ready
  .then(mocked => new Promise((resolve, reject) =>
    mocked
      .on('ready', () => resolve(mocked))
      .on('error', reason => reject(reason))
  )
  // Simulate a request
  .then(() => mocked.request('POST', '/test', { 'content-type': 'application/json' }, JSON.stringify({ name: 'Arnaud' })))
  // Response is returned when ready to be read, .toString() gives the body content 
  .then(response => {
      assert.strictEqual(response.toString(), 'Hello Arnaud !')
  })
```

> Example of `mock`

Call the `request` method to simulate an incoming request, it supports two different signatures :

* `(method, url, headers = {}, body = '', properties = undefined)`
* `({ method, url, headers = {}, body = '', properties = undefined})`

> [!NOTE]
> `properties` is a dictionary merged to the mocked request to simulate members like `socket`.

The method returns a promise resolving to a **mocked response** extending [ServerResponse](https://nodejs.org/api/http.html#class-httpserverresponse) with the following members :

| Member | Type | Description |
|---|---|---|
| `toString()` | `string` | Gives the response body |
| `isInitial` | `boolean` | The response is untouched *(i.e. not processed)* |

> [!IMPORTANT]
> `headers` are managed **case insensitively** in both `Request` and `Response`.

## Mocking handlers

It is possible to specify mocked handlers *(based on their [actual implementation](https://github.com/ArnaudBuchholz/reserve/tree/master/reserve/src/handlers))*:

```javascript
const { mock } = require('reserve')
mock({
  mappings: [{
    file: '$1'
  }]
}, {
  file: {
    redirect: async ({ request, mapping, redirect, response }) => {
      if (redirect === '/') {
        response.writeHead(201, {
          'Content-Type': 'text/plain',
          'Content-Length': 6
        })
        response.end('MOCKED')
      } else {
        return 500
      }
    }
  }
})
  .then(mocked => new Promise((resolve, reject) =>
    mocked
      .on('ready', () => resolve(mocked))
      .on('error', reason => reject(reason))
  )
  .then(mocked => mocked.request('GET', '/'))
    .then(response => {
      assert.strictEqual(response.statusCode, 201)
      assert.strictEqual(response.toString(), 'MOCKED')
    })
```

> Example of mocking the `file` handler
