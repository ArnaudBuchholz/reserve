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

## Features

The `custom` property can be either an [external module](external.md) or a [function](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Functions) that accepts at least two parameters : [`request`](https://nodejs.org/api/http.html#http_class_http_incomingmessage) and [`response`](https://nodejs.org/api/http.html#http_class_http_serverresponse).

* Capturing groups' values are passed as **additional parameters**<br/>(⚠️ if the [function's length](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/length) is `0`or greater than `2`)
* The function is invoked with the **current mapping** being used as `this`
* During the initialization, the **current mapping**'s member named `configuration` is set to the [configuration interface](iconfiguration.md)<br/>(⚠️ it *overwrites* any existing member with the same name)
* The function may return a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
* If the promise is resolved to a value (i.e. not `undefined`), an internal redirection occurs i.e. the request is going over the mappings again (*infinite loops are prevented, see [`max-redirect`](configuration.md#max-redirect-optional)*)
* If the `response` is not **finalized** after executing the function *(i.e. [`response.end`](https://nodejs.org/api/http.html#http_response_end_data_encoding_callback) was not called)*, the `request` is going over the remaining mappings
