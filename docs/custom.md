# `custom` handler

[🔝 REserve documentation](README.md)

Enables **custom** handlers.

```javascript
{
  custom: async (request, response) => response.setHeader('X-Server', 'REserve')
}
```

> Example of embedded mapping with the `custom` handler

```javascript
{
  custom: './xserver.js'
}
```

> Example of mapping with the `custom` handler

```javascript
module.exports = async (request, response) => response.('X-Server', 'REserve')
```

> Corresponding `xserver.js` file

```javascript
{
  custom: () => [
    '<html><title>Not found</title></html>',
    {
      statusCode :404
    }
  ]
}
```

> Example of `custom` mapping sending back a response (new to version 2.1.0)

```javascript
{
  custom: [
    '<html><title>Not found</title></html>',
    {
      statusCode :404
    }
  ]
}
```

> Example of `custom` mapping sending back a response (new to version 2.2.0)

## Features

The `custom` property can be:

* an [external module](external.md) resolving to a `function`,
* a `function` that accepts at least two parameters : [`request`](https://nodejs.org/api/http.html#http_class_http_incomingmessage) and [`response`](https://nodejs.org/api/http.html#http_class_http_serverresponse),
* an `array`, the two first values are passed to [`send`](send.md) to finalize the response.

When `custom` is a `function`:

* Capturing groups' values are passed as **additional parameters**

> [!IMPORTANT]
> Only if the [function's length](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/length) is `0`or greater than `2`

* The function is invoked with the **current mapping** being used as `this`

* During the initialization, the **current mapping**'s member named `configuration` is set to the [configuration interface](iconfiguration.md)

> [!CAUTION]
> It *overwrites* any existing member with the same name

* The function may return a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)

* If the function returns *(or returns a promise resolving to)* a `string` or a `number`, an internal redirection occurs, i.e. the request is going over the mappings again (*infinite loops are prevented, see [`max-redirect`](configuration.md#max-redirect-optional)*)

* With version 2.1.0, if the function returns *(or returns a promise resolving to)* an `array`, the two first values are passed to [`send`](send.md) to finalize the response.

* If the `response` is not **finalized** after executing the function *(i.e. [`response.end`](https://nodejs.org/api/http.html#http_response_end_data_encoding_callback) was not called)*, the `request` is going over the remaining mappings
