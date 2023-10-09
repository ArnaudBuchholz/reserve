# `body` helper

Since version 1.4.0, the package offers a **basic** method to **read the request body**.

```javascript
const { body } = require('reserve')

async function customHandler (request, response) {
  const requestBody = JSON.parse(await body(request))
  /* ... */
}
```
