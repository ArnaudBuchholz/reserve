# `url` handler

[🔝 REserve documentation](README.md)

Answers the request by **forwarding** it to a different URL. It does **not use the [HTTP status code 302](https://en.wikipedia.org/wiki/HTTP_302)**. The external URL is **requested internally** and the **internal response is piped** to the incoming response.

Example :
```json
{
  "match": "^/proxy/(https?)/(.*)",
  "url": "$1://$2",
  "unsecure-cookies": true
}
```

> Example of mapping with the `url` handler

## Features

* Supports [all HTTP methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)

* Capturing groups can be used as substitution parameters

* Redirects to any URL (http or https)

> [!CAUTION]
> It must redirect to an absolute URL.

## Options

| option | type | default | description |
|---|---|---|---|
| `unsecure-cookies` | `boolean` | `false` | When `true`, [secured cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#secure) are converted to unsecure ones. Hence, the browser will keep them even if not running on https.<br>ⓘ this applies **before** `forward-response` |
| `forward-request` | [`ExternalModule`](external.md) \|<br>`((context: ForwardRequestContext) => Promise<void>` | - | when specified, the hook is called **before** generating the forward request. See below.
| `forward-response` | [`ExternalModule`](external.md) \|<br>`((context: ForwardResponseContext) => Promise<RedirectResponse>)` | - | When specified, the hook is called **after** sending the forward request but **before** writing the current request's response. See below.
| `ignore-unverifiable-certificate` | `boolean` | `false` | When `true`, the request does not fail when contacting a server which SSL certificate can not be verified. |
| `absolute-location` | `boolean` | `false` | When `true`, any relative `location` header is made absolute to the redirected URL.<br>ⓘ this applies **before** `forward-response` |

> [!IMPORTANT]
> The `context` parameter is a unique object *(one per request)* allocated to link the `forward-request` and `forward-response` callbacks. It enables **request-centric communication** between the two: whatever members you add on it during the `forward-request` callback will be kept and transmitted to the `forward-response` callback.

## `forward-request`

This hook is called **before** generating the forward request.

The expected signature is :

`async function ({ configuration, context, mapping, match, request, incoming })`

With :
* `configuration` the [configuration interface](iconfiguration.md)
* `context` a modifiable object used to share data with the `forward-response` hook
* `mapping` the mapping being executed
* `match` the regular expression [exec result](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec)
* `request` a modifiable object describing the forward request, it contains :
  * `method`
  * `url`
  * `headers`
* `incoming` the incoming request

Changing the `request` properties will **impact** the forward request.

> [!CAUTION]
> Do not consume the incoming request body or it won't be available for the forward request.

## `forward-response`

This hook is called **after** sending the forward request but **before** writing the result to the current request's response.

The expected signature is :

`async function ({ configuration, context, mapping, match, request,  statusCode, headers })`

With :
* `configuration` the [configuration interface](iconfiguration.md)
* `context` a modifiable object used to share data with the `forward-request` hook
* `mapping` the mapping being executed
* `match` the regular expression [exec result](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec)
* `request` an object describing the forwarded request, it contains :
  * `method`
  * `url`
  * `headers`
* `incoming` the incoming request
* `statusCode` the received response status code
* `headers` the received response headers

If the request's method was `GET` or `HEAD`, it is possible to trigger an **internal redirection** by returning a value from this hook.
