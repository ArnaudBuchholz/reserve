# Mocking

Since version 1.1.0, REserve includes an **helper to build tests**. It receives a **configuration** and returns a **promise** resolving to an object exposing the expected methods (`on`, `close`) **augmented with a `request` method** to simulate incoming requests.

```javascript
const assert = require('assert')
const { mock, read } = require('reserve')

read('/reserve.json')
  .then(configuration => mock(configuration))
  .then(mocked => mocked.request('POST', '/test', { 'content-type': 'application/json' }, JSON.stringify({ name: 'Arnaud' })))
  .then(response => {
      assert.strictEqual(response.toString(), 'Hello Arnaud !')
  })
```

Call the `request` method to simulate an incoming request, it supports two different signatures :

* `(method, url, headers = {}, body = '', properties = undefined)`
* `({ method, url, headers = {}, body = '', properties = undefined})`

*`properties` is a dictionary merged to the mocked request to simulate members like `socket`*

The method returns a promise resolving to a mocked response exposing the following members :

| Member | Type | Description |
|---|---|---|
| **headers** | Object | Response headers
| **statusCode** | Number | Status code
| **finished** | Boolean | `true`
| **toString()** | String | Gives the response body

**NOTE** : headers are managed **case insensitively** in both `Request` and `Response`.

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

