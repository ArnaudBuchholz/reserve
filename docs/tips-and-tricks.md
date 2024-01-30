# Tips & Tricks

## URL parameters

In general, it is **not** recommended to match URL parameters in the mapping. Indeed, the order is usually not significant and it is not possible to write a regular expression that will capture them individually.

Instead, capture the list of parameters and use the [UrlSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) to parse and extract them.

For instance :
```JavaScript
const mapping = {
  match: /^\/whatever(\?.*)/,
  custom: function (request, url, search) {
    const parameters = new UrlSearchParams(search)
  }
}
```
