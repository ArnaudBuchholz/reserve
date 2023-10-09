# `use` handler

Enables the use of [express middleware functions](https://www.npmjs.com/search?q=keywords%3Aexpress%20keywords%3Amiddleware).

**NOTE** : Supports only middleware functions accepting exactly three parameters (`request`, `response` and `next`) as described [here](http://expressjs.com/en/guide/writing-middleware.html).

**NOTE** : This is an **experimental feature** that needs deeper testing.

Example :

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

| option | type | default | description |
|---|---|---|---|
| `options` | Object | `{}` | Options passed to the middleware factory |