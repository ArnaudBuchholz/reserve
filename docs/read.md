# `read` helper

[🔝 REserve documentation](README.md)

REserve offers a method to **read configuration files**.

```typescript
function read (filename: string): Promise<Configuration>
```

> Types definition for `read`

The configuration must comply with the properties and mappings [documented here](configuration.md).

The [`extend`](configuration.md#extend) property enables the chaining of configuration files to **foster reusability**, like in the following example.

```json
{
  "extend": "./mappings.json",
  "port": 5000
}
```

> Example of a configuration file extending another one

```json
{
  "mappings": [{
    "match": "^/private/",
    "status": 403
  }, {
    "match": "^/(.*)",
    "file": "./$1"
  }, {
    "status": 404
  }]
}
```

> `mappings.json` configuration file