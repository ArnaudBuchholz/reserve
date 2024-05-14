# Mocking

[🔝 REserve documentation](README.md)

From the beginning, REserve includes an **helper to build tests**.

It receives a **configuration** and returns a server object **augmented with a `request` method** to simulate incoming requests.

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

> Type definitions for `mock`

Call the `request` method to simulate an incoming request, it supports two different signatures :

* `(method, url, headers = {}, body = '', properties = undefined)`
* `({ method, url, headers = {}, body = '', properties = undefined})`

> [!NOTE]
> `properties` is a dictionary merged to the mocked request to simulate members like `socket`

The method returns a promise resolving to a mocked response exposing the following members :

| Member | Type | Description |
|---|---|---|
| **headers** | Object | Response headers
| **statusCode** | Number | Status code
| **finished** | Boolean | `true`
| **toString()** | String | Gives the response body

> [!IMPORTANT]
> `headers` are managed **case insensitively** in both `Request` and `Response`.

Example :

```javascript
const { mock } = require('reserve')
mock({
  port: 8080,
  mappings: [{
    match: /^\/(.*)/,
    file: path.join(__dirname, '$1')
  }]
})
  .then(mocked => mocked.request('GET', '/'))
  .then(response => {
    assert(response.statusCode === 200)
    assert(response.toString() === '<html />')
  })
```

You may provide mocked handlers *(based on their [actual implementation](https://github.com/ArnaudBuchholz/reserve/tree/master/handlers))*:

```javascript
const { mock } = require('reserve')
mock({
  port: 8080,
  mappings: [{
    match: /^\/(.*)/,
    file: path.join(__dirname, '$1')
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
  .then(mocked => mocked.request('GET', '/'))
    .then(response => {
      assert(response.statusCode === 201)
      assert(response.toString() === 'MOCKED')
    })
```

