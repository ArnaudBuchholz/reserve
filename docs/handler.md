# Custom handler

[🔝 REserve documentation](README.md)

A custom handler is an **object** with predefined properties.

## Optional properties

### `method`

A comma separated string or an array of [HTTP verbs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) that indicates which methods are **supported** by the handler.

> [!IMPORTANT]
> When REserve **validates** a mapping, it matches the mapping's `method` with the handler's list of supported methods. In case of mismatch, an error is raised.

When no value is provided, REserve considers that all verbs are supported by the handler.

### `schema`

A mapping **validation** schema.

The schema syntax is designed to be short and self-explanatory. It consists in a dictionary mapping a **property name** to its **specification**.

The specification can be either:
* Simple type, for instance: `'string'`
* Multiple types, for instance `['function', 'string']`
* An object containing `type` (or `types` for an array) and a `defaultValue` for optional properties.

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

> Example of a schema definition for two properties

If provided, the schema is applied on the mapping **before** the `validate` function. If you need better validation, implement the `validate` function.

### `validate`

An [asynchronous](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) method that **validates** mapping definition.

> [!WARNING]
> The mapping will also contain REserve's mapping properties such as `cwd`, `match`...
> The function should **focus only** on handler's specific settings.


The method is called with two **parameters**:
  - `mapping` : the mapping being validated
  - `configuration` : the [configuration interface](iconfiguration.md)

If validation fails, the method should **throw an error**.

## Required properties

### `redirect`

A method that *may* return a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) and that will be called with an **object** containing :
  - `configuration` : the [configuration interface](iconfiguration.md)
  - `mapping` : the mapping being executed
  - `match` : the regular expression [exec result](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec)
  - `redirect` : the value associated with the handler prefix in the mapping. Capturing groups **are** substituted (see [below](#capturing-groups-and-interpolation)).
  - `request` : Node.js' [http.IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage)
  - `response` : Node.js' [http.ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse)

### Capturing groups and interpolation

By default, the handler prefix is **interpolated**. Identified **placeholders are substituted** with values coming from the capturing groups of the matching regular expression.

Several syntaxes are accepted for placeholders :
* `$<index>` : `<index>` represents the capturing group index in the regular expression (1-based), value is replaced **as-is**
* `$<name>` : `<name>` represents the capturing group name in the regular expression, value is replaced **as-is**

It is possible to **reuse the mechanism** by importing the [`interpolate` helper](interpolate.md).
