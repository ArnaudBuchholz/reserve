# ✅ Configuration

[🔝 REserve documentation](README.md)

| Setting | Default
|---|---|
| [`cwd`](#cwd) | `process.cwd()` |
| [`hostname`](#hostname) | `undefined` |
| [`port`](#port) | `5000` |
| [`max-redirect`](#max-redirect) | `10` |
| [`ssl`](#ssl) | `undefined` |
| [`http2`](#http2) | `false` |
| [`httpOptions`](#httpOptions) | `undefined` |
| [`handlers`](#handlers) | `undefined` |
| [`listeners`](#listeners) | `[]` |
| [`extend`](#extend) | `undefined` |
| [`mappings`](#mappings) | `[]` |
| [mapping's `method`](#method) | `undefined` |
| [mapping's `match`](#match) | `/(.*)/` |
| [mapping's `invert-match`](#invert-match) | `false` |
| [mapping's `if-match`](#if-match) | `undefined` |
| [mapping's `exclude-from-holding-list`](#exclude-from-holding-list) | `false` |

## General settings

### `cwd`

Defines the current working folder. This value is **inherited** by mappings but can be **overridden** at mapping level.

Optional, defaulted to [`process.cwd()`](https://nodejs.org/docs/latest/api/process.html#processcwd).

### `hostname`

Used to set the `host` parameter when calling http(s) server's [listen](https://nodejs.org/api/net.html#net_server_listen).

Optional, defaulted to `undefined`.

### `port`

Used to set the `port` parameter when calling http(s) server's [listen](https://nodejs.org/api/net.html#net_server_listen).

The value `0` allocates automatically a free port.

Optional, defaulted to `5000`.

## `max-redirect`

Limits the number of internal redirections. If the number of redirections goes beyond the parameter value, the request fails with error [`508`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/508).

Optional, defaulted to `10`.

## `ssl`

This object provides certificate information to build an https server.

> [!TIP]
> You might be interested by the article [An Express HTTPS server with a self-signed certificate](https://flaviocopes.com/express-https-self-signed-certificate/).

The object must contain two members :
* `cert` : a relative *(to `cwd`)* or absolute path to the certificate file,
* `key` : a relative *(to `cwd`)* or absolute path to the key file.

Optional, defaulted to `undefined`.

## `http2`

When set to `true`, REserve allocates an [HTTP/2](https://en.wikipedia.org/wiki/HTTP/2) server.

> [!IMPORTANT]
> Since browsers do not connect to an unsecure HTTP/2 server, use `ssl`.

Optional, defaulted to `false`.

## `httpOptions`

This object provides **additional server creation options** *(not validated)* being passed to the appropriate native API :

| ssl | http2 | API |
|---|---|---|
| `undefined` | `false` | [http.createServer](https://nodejs.org/api/http.html#http_http_createserver_options_requestlistener) |
| *set* | `false` | [https.createServer](https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener) |
| `undefined` | `true` | [http2.createServer](https://nodejs.org/api/http2.html#http2_http2_createserver_options_onrequesthandler) |
| *set* | `true` | [http2.createSecureServer](https://nodejs.org/api/http2.html#http2_http2_createsecureserver_options_onrequesthandler) |

Optional, defaulted to `undefined`.

## `handlers`

An object associating a handler prefix to a handler definition.
If the definition is a string, the handler is loaded as an [external module](external.md).

Optional, defaulted to `undefined`.

In the following example : every mapping containing the `cache` property will be associated to the [REserve/cache](https://www.npmjs.com/package/reserve-cache) handler.

```json
{
  "handlers": {
    "cache": "reserve-cache"
  }
}
```

> Associating `cache` prefix to `reserve-cache` handler

See [Custom handlers](handler.md) for more information.

> [!WARNING]
> It is not possible to change the associations of the default prefixes (`custom`, `file`, `status`, `url`, `use`).
> 
> **No error** will be thrown if a prefix collides with a predefined one.

## `listeners`

An array of **functions** or **[external module](external.md) exporting a function** which will be called with the **REserve server object**. The purpose is to allow events registration **before** the server starts and give access to the `created` event.

Optional, defaulted to `[]`.

## `extend`

> [!IMPORTANT]
> Only for JSON configuration files.

A relative or absolute path to another configuration file to extend.
If relative, the **current** configuration file directory is considered.

The current settings **overwrite** the ones coming from the extended configuration file.

Extended `mappings` are imported at the **end** of the resulting array, making the current ones **being evaluated first**. This way, it is possible to override the extended mappings.

## mappings

An array of mappings :

* For each incoming request, the mappings are evaluated **in the order** of declaration,
* Several mappings *may* apply to the same request,
* Evaluation stops when the response is **finalized** *(after calling `response.end()`, when `response.writableEnded === true`)*.
* When a handler triggers a redirection, the array of mappings is re-evaluated **from the beginning**.

See [technical details](technical%20details.md) for more information.

Each mapping is an object which :

* *must* contain a handler prefix : for instance `custom`, `file`, `status`, `url`, `use`,
* *may* define the `cwd` property to override the current working directory,
* *may* contain the following properties (they are all optional) :

### `method`

A comma separated string or an array of [HTTP verbs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) that is matched with the [request method](https://nodejs.org/api/http.html#http_message_method).

> [!CAUTION]
> Each **handler may provide its own `method` definition** restricting the list of implemented verbs. For instance, `file` supports only `GET` and `HEAD`. The mapping's `method` value **cannot** allow a verb that is not implemented. As a consequence **an error is thrown** if the combination of handler and mapping `method` parameters leads to an empty list.

Optional, defaulted to `undefined` *(meaning all methods are allowed)*.

### `match`

A string or a regular expression that will be compared with / applied to the [request URL](https://nodejs.org/api/http.html#http_message_url).

[Capturing groups](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Capturing_group) and [named capturing groups](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Named_capturing_group) are supported and used to [interpolate](interpolate.md) the handler prefix.

When defined as a string, the conversion depends on the string content :
  * If the string contains any character amongst `()^$[]|\\?+*{}`, it is treated as a regular expression (`.` does **not** belong to this list).
  * Otherwise, the string is converted to a regular expression that matches the beginning of the string *(and captures the rest)*. For instance `/path` is converted to `/^\/path\b(.*)/`.
  * If the string is not treated as a regular expression and it contains query parameters (a word prefixed with `:`), then the regular expression captures the query parameter as a named group. For instance `/books/:id` is converted to `/^\/books\/(?<id>[^/]*)\\b(.*)/`.

Optional, defaulted to `/(.*)/` *(meaning any url is matched)*.

### `invert-match`

Inverts the matching process when set to `true` *(only allowed value)*. It enables the implementation of an *'all but'* pattern. A typical use forbids unexpected verbs by creating an inverted match on the list of supported verbs.

Optional, defaulted to `false`.

### `if-match`

A function being executed only if the mapping matches the request (*meaning after applying `match`, `method` and `invert-match`*). It receives the `request` object, the current `url` *(in case of internal redirection, it might differ from `request.url`)* and the current `match` result. If the result is truthy, the mapping is applied otherwise it is ignored.

### `exclude-from-holding-list`

*  *(optional)* : when set to `true` *(only allowed value)*, it instructs REserve to ignore any request processed by this mapping when updating the list of mappings with [`configuration.setMappings`](iconfiguration.md#async-setmappings-mappings-request-timeout--5000).

Optional, defaulted to `false`.
