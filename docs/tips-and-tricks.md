# Tips & Tricks

[🔝 REserve documentation](README.md)

## URL parameters

It is **not** recommended to match URL parameters in a mapping. Indeed, the **order** is not significant and it is not possible to write a regular expression that will capture each parameter **individually**.

Instead, capture the **list** of parameters and use the [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) to **parse and extract** them.

For instance :

```JavaScript
const mapping = {
  match: '/^\/whatever(\?.*)/,
  custom: (request, url, search) => {
    const parameters = new URLSearchParams(search)
    const param1 = parameters.get('param1') ?? 'default'
  }
}
```

> Example of `URLSearchParams` to capture URL parameters

> [!NOTE]
> When using a simple `match` (for instance : `/whatever`), REserve generates a regular expression that automatically captures the URL parameters.
