It accepts two parameters:
* **match** the regular expression [exec result](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec)
* **value** accepting multiple types :
  - `string` : value is interpolated and the result returned
  - `object` : property values are interpolated **recursively** and a new object is returned
  - otherwise the value is returned **as-is**
