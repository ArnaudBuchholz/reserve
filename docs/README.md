<p align="center">
  <img src="https://arnaudbuchholz.github.io/gfx/REserve.png" alt="REserve logo" width="300px"/>
</p>

# REserve 2️⃣ Documentation

> [!IMPORTANT]
> [Migration guide From v1 to v2](v1_to_v2.md)

## ✅ Configuration

There are two ways to use REserve :

* Run as a **standalone command line** with a **configuration file** *(default name is `reserve.json`)*

```json
{
  "port": 8080,
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

> Example of `reserve.json` configuration file

> [!NOTE]
> If [`process.send`](https://nodejs.org/api/process.html#process_process_send_message_sendhandle_options_callback) is available, REserve notifies the parent process when the server is ready by sending the message `'ready'`.

* **Embed** with its configuration in a **custom application**

```JavaScript
import { serve, log } from 'reserve'

log(serve({
  "port": 8080,
  "mappings": [{
    "match": "^/private/",
    "status": 403
  }, {
    "match": "^/(.*)",
    "file": "./$1"
  }, {
    "status": 404
  }]
}))
```

> Example of reserve being embedded in an application

In both cases, the configuration must comply with the properties and mappings [documented here](configuration.md).

> [!TIP]
> [tips & tricks](tips-and-tricks.md)

## ⚙ Handlers

REserve is **delivered** with the following default handlers :

* [`file`](file.md) : to serve resources from the file system
* [`status`](status.md) : to end response with a specific status
* [`url`](url.md) : to serve resources from a web address
* [`custom`](custom.md) : to enable custom coding
* [`use`](use.md) : to integrate packaged middlewares (express)

Other additional handlers can be installed **separately** and plugged through the [`handlers` configuration property](configuration.md#handlers).
If you plan to build your **own handler**, here is [what you need to know](handler.md).

## ⚡ Server events

The REserve server object implements an interface that mimics the [EventEmitter::on method](https://nodejs.org/api/events.html#emitteroneventname-listener) and, during execution, it triggers [**events with parameters**](events.md) to **notify** any listener of **its activity**.

## 📦 Exports

REserve exports methods and helpers to simplify implementations :
* [`serve`](serve.md) : to start the server
* [`read`](read.md) : to read a configuration file, supports `extends`
* [`check`](check.md) : to check a configuration
* [`log`](log.md) : to handle and output server logs
* [`interpolate`](interpolate.md) : to interpolate values in a string or an object
* [`body`](body.md) : to read a request body
* [`send`](send.md) : to build a response
* [`capture`](capture.md) : to copy the response stream to another stream *(for instance: to create a [cache](cache%20and%20proxy.md))*
* [`punycache`](https://www.npmjs.com/package/punycache) : a minimalist cache implementation

## 🧪 Testing / Mocking

REserve includes a [mocking environment](mocking.md) to **ease the tests**. It takes the **configuration** and returns a fake server object **augmented with a `request` method** to simulate incoming requests.

## ⌛ Version history

Here is the [**history of versions**](https://github.com/ArnaudBuchholz/reserve/blob/main/reserve/CHANGELOG.md) with their associated changes.

## 📚 Articles

### [Rational](rational.md)

Sometimes, a simple idea leads to very interesting projects.
This article explains the creation of [REserve](https://www.npmjs.com/package/reserve) best described as a **lightweight** web server statically **configurable** with regular expressions that can also be **embedded** and **extended**.

### [Technical details](technical%20details.md)

Based on a **clean concept**, the development of [REserve](https://www.npmjs.com/package/reserve) follows a **simple architecture** that enables **flexibility** and **extensibility**. This article provides keys to understand the **modular structure** of the implementation.

### [Serving an OpenUI5 application](openui5.md)

The best way to explain **what REserve can do** is to demonstrate some of its features through a **concrete use case**.
This article illustrates how one can quickly setup a server to **facilitate the execution of OpenUI5 applications**.

### [Cache and Proxy](cache%20and%20proxy.md)

With version 1.8.0, [REserve](https://www.npmjs.com/package/reserve) offers **the capture helper** that enables the **copy of the response content while processing a request**. In this article, an example will be presented in two different flavors to illustrate the **new possibilities** introduced by this tool.

### [Performances](performances.md)

A benchmark realized to compare performances of express, koa, fastify and REserve.
