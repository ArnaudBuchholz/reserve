# `interpolate` helper

[🔝 REserve documentation](README.md)

REserve offers a method to **interpolate** values in a string or an object, enabling the writing of patterns.

```typescript
function interpolate (match: RegExpMatchArray, pattern: string): string
function interpolate (match: RegExpMatchArray, pattern: object): object
```

> Types definition for `interpolate`

The method accepts two parameters:

* **match** the regular expression [exec result](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec)

* **pattern** accepting multiple types :
  - `string` : value is interpolated and the result returned
  - `object` : property values are interpolated **recursively** and a new object is returned
