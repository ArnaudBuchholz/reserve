# `url` handler

Answers the request by **forwarding** it to a different URL. It does **not use the [HTTP status code 302](https://en.wikipedia.org/wiki/HTTP_302)**. The external URL is **requested internally** and the **response is piped** to the incoming request.

Example :
```json
{
  "match": "^/proxy/(https?)/(.*)",
  "url": "$1://$2",
  "unsecure-cookies": true
}
```

* Supports [all HTTP methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)
* Capturing groups can be used as substitution parameters
* Redirects to any URL (http or https)

**NOTE** : It must redirect to an absolute URL

| option | type | default | description |
|---|---|---|---|
| `unsecure-cookies` | Boolean | `false` | when `true`, the secured cookies are converted to unsecure ones. Hence, the browser will keep them even if not running on https. |
| `forward-request` | String or Function | - | when specified, the function is called **before** generating the forward request. The expected signature is  `function ({ configuration, context, mapping, match, request: { method, url, headers }, incoming })`. Changing the request settings will **impact** the forward request.
| `forward-response` | String or Function | - | when specified, the function is called **after** sending the forward request but **before** writing the current request's response. The expected signature is `function ({ configuration, context, mapping, match, headers })`. Changing the headers will directly impact the current request's response.
| `ignore-unverifiable-certificate` | Boolean | `false` | when `true`, the request does not fail when contacting a server which SSL certificate can not be verified. |

**NOTE** : When a string is used for `forward-request` or `forward-response`, the corresponding function is loaded with [require](https://nodejs.org/api/modules.html#modules_require_id).

**NOTE** : The `context` parameter is a unique object *(one per request)* allocated to link the `forward-request` and `forward-response` callbacks. It enables **request-centric communication** between the two: whatever members you add on it during the `forward-request` callback will be kept and transmitted to the `forward-response` callback.

