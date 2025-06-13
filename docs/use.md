# `use` handler

[🔝 REserve documentation](README.md)

Enables the use of [express middleware functions](https://www.npmjs.com/search?q=keywords%3Aexpress%20keywords%3Amiddleware).

```json
{
  "use": "express-session",
  "options" : {
    "secret": "keyboard cat",
    "resave": false,
    "saveUninitialized": true
  }
}
```

> Example of mapping with the `use` handler with [`express-session`](https://www.npmjs.com/package/express-session)

```json
{
  "use": "cors",
  "options" : {
    "origin": "http://example.com",
    "methods": "GET,POST"
  }
}
```

> Example of mapping with the `use` handler with [`cors`](https://www.npmjs.com/package/cors)


## Features

> [!IMPORTANT]
> Supports only middleware functions accepting exactly three parameters (`request`, `response` and `next`) as described [here](http://expressjs.com/en/guide/writing-middleware.html).

## Options

| option | type | default | description |
|---|---|---|---|
| `options` | `object` | `{}` | Options passed to the middleware factory |
