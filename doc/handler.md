# Custom handler

A custom handler object may define:

* **schema** *(optional)* a mapping validation schema, see [below](#schema) for the proposed syntax

* **method** *(optional)* a comma separated string or an array of [HTTP verbs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) that indicates which methods are implemented. When no value is provided, REserve considers that any verb is supported.

* **validate** *(optional)* an [asynchronous](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) method that validates mapping definition, it will be called with two **parameters**:
  - **mapping** the mapping being validated
  - **configuration** the [configuration interface](#configuration-interface)


* **redirect** *(mandatory)* an [asynchronous](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) method that will be called with an **object** exposing:
  - **configuration** the [configuration interface](#configuration-interface)
  - **mapping** the mapping being executed
  - **match** the regular expression [exec result](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec)
  - **redirect** the value associated with the handler prefix in the mapping. Capturing groups **are** substituted.
  - **request** Node.js' [http.IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage)
  - **response** Node.js' [http.ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse)

### Capturing groups and interpolation

By default, the handler prefix is **interpolated**. Identified **placeholders are substituted** with values coming from the capturing groups of the matching regular expression.

Three syntaxes are accepted for placeholders, `<index>` represents the capturing group index in the regular expression (1-based):
* `$<index>` value is replaced **as-is**
* `$&<index>` value is first **decoded** with [decodeURI](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURI)
* `$%<index>` value is first **decoded** with [decodeURIComponent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent)

When writing an handler, it is possible to **reuse the mechanism** by importing the function `require('reserve').interpolate`. It accepts two parameters:
* **match** the regular expression [exec result](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec)
* **value** accepting multiple types :
  - `string` : value is interpolated and the result returned
  - `object` : property values are interpolated **recursively** and a new object is returned
  - otherwise the value is returned **as-is**

### Schema

The schema syntax is designed to be short and self-explanatory. It is a dictionary mapping a property name to its specification.

It can be either:
* Simple type specification (for instance: `"string"`)
* Multiple types specification (for instance `["function", "string"]`)
* Complete specification: an object containing `type` (or `types`) and a `defaultValue` for optional properties.

For instance, the following schema specification defines:
* a **mandatory** `custom` property that must be either a `function` or a `string`
* an **optional** `watch` boolean property which default value is `false`

```json
{
  "schema": {
    "custom": ["function", "string"],
    "watch": {
      "type": "boolean",
      "defaultValue": false
    }
  }
}
```

If provided, the schema is applied on the mapping **before** the **validate** function.
