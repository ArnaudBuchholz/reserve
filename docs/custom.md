# `custom` handler

Enables **custom** handlers.

Examples :
```javascript
{
  custom: async (request, response) => response.setHeader('X-Server', 'REserve')
}
```

Or using an external module :

```javascript
{
  custom: './xserver.js'
}
```

with `xserver.js` :
```javascript
module.exports = async (request, response) => response.('X-Server', 'REserve')
```

External modules are loaded with Node.js [require](https://nodejs.org/api/modules.html#modules_require_id) API.

`custom` must resolve to a [function](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Functions) that accepts at least two parameters : [`request`](https://nodejs.org/api/http.html#http_class_http_incomingmessage) and [`response`](https://nodejs.org/api/http.html#http_class_http_serverresponse).
* Capturing groups' values are passed as **additional parameters**<br/>(⚠️ if the [function's length](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/length) is greater than `2`)
* The function is invoked with the **current mapping** being used as `this`
* During the initialization, the **current mappping**'s member named `configuration` is set to the [configuration interface](iconfiguration.md)<br/>(⚠️ it *overwrites* any existing member)
* This function may return a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
* If the promise is resolved to a value (i.e. not `undefined`), an internal redirection occurs i.e. the request is going over the mappings again (*infinite loops are prevented, see `max-redirect`*)
* If the `response` is not **finalized** after executing the function *(i.e. [`response.end`](https://nodejs.org/api/http.html#http_response_end_data_encoding_callback) was not called)*, the `request` is going over the remaining mappings
