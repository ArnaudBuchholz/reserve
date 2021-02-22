# `custom` handler

Enables 'simple' **custom** handlers.

Examples :
```javascript
{
  custom: async (request, response) => response.setHeader('Access-Control-Allow-Origin', '*')
}
```

Or using an external module :

```javascript
{
  custom: './cors.js'
}
```

with `cors.js` :
```javascript
module.exports = async (request, response) => response.setHeader('Access-Control-Allow-Origin', '*')
```

External modules are loaded with Node.js [require](https://nodejs.org/api/modules.html#modules_require_id) API.

`custom` must point to a [function](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Functions)
* That takes at least two parameters : [`request`](https://nodejs.org/api/http.html#http_class_http_incomingmessage) and [`response`](https://nodejs.org/api/http.html#http_class_http_serverresponse)
* Capturing groups' values are passed as **additional parameters**
* The function is invoked with the **current mapping** being used as `this`
* If, during the initialisation, the **current mappping** did not have a member named `configuration`, this member is set to the [configuration interface](iconfiguration.md)
* This function may return a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
* If the promise is resolved to a value (i.e. not `undefined`), an internal redirection occurs i.e. the request is going over the mappings again (*infinite loops are now prevented, see `max-redirect`*).
* If the `response` is not **finalized** after executing the function *(i.e. [`response.end`](https://nodejs.org/api/http.html#http_response_end_data_encoding_callback) was not called)*, the `request` is going over the remaining mappings

| option | type | default | description |
|---|---|---|---|
| `watch` | Boolean | `false` | when `true` and using a local module *(does not work with `node_modules`)* the file's modified time is checked before executing the handler. When changed, the module is reloaded |
