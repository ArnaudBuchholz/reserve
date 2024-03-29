# Configuration

## cwd *(optional)*

Defines the current working folder.

Defaulted to `process.cwd()`.

## hostname *(optional)*

Used to set the `host` parameter when calling http(s) server's [listen](https://nodejs.org/api/net.html#net_server_listen).

Default is `undefined`.

## port *(optional)*

Used to set the `port` parameter when calling http(s) server's [listen](https://nodejs.org/api/net.html#net_server_listen).

From version 1.9.3, the value `auto` allocates automatically a free port (equivalent to passing `0` to [listen](https://nodejs.org/api/net.html#net_server_listen)).

Default is `5000`.

## max-redirect *(optional)*

Limits the number of internal redirections. If the number of redirections goes beyond the parameter value, the request fails with error [`508`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/508).

Default is `10`.

## ssl *(optional)*

This object provides certificate information to build an https server. You might be interested by the article [An Express HTTPS server with a self-signed certificate](https://flaviocopes.com/express-https-self-signed-certificate/).

The object must contain :
* `cert` : a relative or absolute path to the certificate file
* `key` : a relative or absolute path to the key file

If relative, the configuration file directory or the current working directory (when embedding) is considered.

## http2 *(optional)*
*From version 1.11.0*

When set to `true`, REserve allocates an [HTTP/2](https://en.wikipedia.org/wiki/HTTP/2) server.

**NOTE** : Since browsers do not connect to an unsecure HTTP/2 server, use `ssl`.

## httpOptions *(optional)*
*From version 1.11.0*

This object provides **additional server creation options** *(not validated)* being passed to the appropriate native API :
* [http.createServer](https://nodejs.org/api/http.html#http_http_createserver_options_requestlistener)
* [https.createServer](https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener)
* [http2.createServer](https://nodejs.org/api/http2.html#http2_http2_createserver_options_onrequesthandler)
* [http2.createSecureServer](https://nodejs.org/api/http2.html#http2_http2_createsecureserver_options_onrequesthandler)

## handlers

An object associating a handler prefix to a handler object.
If the property value is a string, the handler is obtained using  [require](https://nodejs.org/api/modules.html#modules_require_id).

For instance : every mapping containing the `cache` property will be associated to the [REserve/cache](https://www.npmjs.com/package/reserve-cache) handler.

```json
{
  "handlers": {
    "cache": "reserve-cache"
  }
}
```

**NOTE** : it is not possible to change the associations of the default prefixes (`custom`, `file`, `status`, `url`, `use`). **No error** will be thrown if a prefix collides with a predefined one.

See [Custom handlers](#custom-handlers) for more information.

## mappings

An array of mappings :
* For each incoming request, the mapings are evaluated in the order of declaration
* Several mappings may apply to the same request
* Evaluation stops when the request is **finalized** *(see the note below)*
* When a handler triggers a redirection, the array of mappings is re-evaluated

**NOTE** : REserve hooks the [`response.end`](https://nodejs.org/api/http.html#http_response_end_data_encoding_callback) API to detect when the response is finalized.

Each mapping may contain :
* `match` *(optional)* : a string *(converted to a regular expression)* or a regular expression that will be applied to the [request URL](https://nodejs.org/api/http.html#http_message_url), defaulted to `"(.*)"`

* `method` *(optional)* : a comma separated string or an array of [HTTP verbs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) that is matched with the [request method](https://nodejs.org/api/http.html#http_message_method), defaulted to `undefined` *(meaning all methods are allowed)*.

* `invert-match` *(optional)* : inverts the matching process when set to `true` *(only allowed value)*. It enables the implementation of an *'all but'* pattern. A typical use forbids unexpected verbs by creating an inverted match on the list of supported verbs.

* `if-match` *(optional)* : a function being executed only if the mapping matches the request (*meaning after applying `match`, `method` and `invert-match`*). It receives the request object, the current url *(in case of internal redirections)* and the current match result. It may return a `string` or a `number` to trigger an internal redirection or any other value. If truthy, the mapping is applied otherwise it is ignored.<br /> **NOTE** : If the mapping handler value relies on captured groups, the `if-match` methods **must** return the match parameter.

* `exclude-from-holding-list` *(optional)* : when set to `true` *(only allowed value)*, it instructs REserve to ignore any request processed by this mapping when updating the list of mappings with [`configuration.setMappings`](iconfiguration.md#async-setmappings-mappings-request-timeout--5000).

* the handler prefix *(required)* : for instance `custom`, `file`, `status`, `url`, `use`... which value may contain capturing groups *(see [Custom handlers](#custom-handlers))*

* `cwd` *(optional)* : the current working directory to consider for relative path, defaulted to the configuration file `cwd`

**NOTE** : when using `custom` in a [JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON) file, since functions can't be used in this format, the expected value is a string referencing the relative or absolute module to load. If relative, the `cwd` member is considered.

**NOTE** : each **handler may provide its own `method` parameter** depending on which verbs are implemented. For instance, `file` supports only `GET` and `HEAD`. The mapping's `method` value **cannot** allow a verb that is not implemented. As a consequence **an error is thrown** if the combination of handler and mapping `method` parameters leads to an empty list.

For instance :

* `reserve.json` :

```json
{
  "port": 8080,
  "mappings": [{
    "custom": "./cors"
  }, {
    "match": "^/(.*)",
    "file": "./$1"
  }]
}
```

* `cors.js` :

```javascript
module.exports = async (request, response) => response.setHeader('Access-Control-Allow-Origin', '*')
```

## listeners

An array of **functions** or **module names exporting a function** which will be called with the **REserve object**. The purpose is to allow events registration before the server starts and give access to the `created` event.

## extend

*Only for JSON configuration*

A relative or absolute path to another configuration file to extend.
If relative, the current configuration file directory is considered.

The current settings overwrite the ones coming from the extended configuration file.

Extended `mappings` are imported at the end of the resulting array, making the current ones being evaluated first. This way, it is possible to override the extended mappings.
