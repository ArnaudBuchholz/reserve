# REserve Documentation

## ⚠️ Migration guide

* [From v1 to v2](v1_to_v2.md)

## Configuration

There are two ways to **leverage** REserve :
* Run as a **standalone command line** with a **configuration file** *(default name is `reserve.json`)*
* **Embed** with its configuration in a **custom application**

In both cases, the configuration must comply with the properties and mappings [documented here](configuration.md).

## Handlers

REserve is **delivered** with the following default handlers :
* [`file`](file.md) to serve resources from the file system
* [`url`](url.md) to internally forward the request to any web address
* [`custom`](custom.md) to enable custom coding
* [`use`](use.md) *(experimental)* to integrate [express middlewares](https://www.npmjs.com/search?q=keywords%3Aexpress%20keywords%3Amiddleware)

Other additional handlers can be installed **separately** and plugged through the `handlers` configuration property.

| handler | description |
|---|---|
| [REserve/cache](https://www.npmjs.com/package/reserve-cache) | Caches string in memory |
| [REserve/cmd](https://www.npmjs.com/package/reserve-cmd) | Wraps command line execution |
| [REserve/fs](https://www.npmjs.com/package/reserve-fs) | Provides [fs](https://nodejs.org/api/fs.html) APIs to the browser |

If you plan to build your **own handler**, here is [what you need to know](handler.md).

## Server events

The server object implements the [EventEmitter](https://nodejs.org/api/events.html) class and, during execution, it throws [**events with parameters**](events.md) to **notify** any listener of **its activity**.

## Helpers

REserve also offers some helpers to simplify implementations :
* [`body`](body.md) to read a request body
* [`send`](send.md) to build a response
* [`capture`](capture.md) to copy the response stream to another stream *(for instance: to create a [cache](cache%20and%20proxy.md))*
* [`punycache`](https://www.npmjs.com/package/punycache) a minimalist cache implementation

## Mocking

REserve includes a [mocking environment](mocking.md) to **simplify the tests**. It takes the **configuration** and asynchronously returns an [EventEmitter](https://nodejs.org/api/events.html) **augmented with a `request` method** to simulate incoming requests.

## Version history

Here is the [**history of versions**](history.md) with their associated changes.

# Articles

## [Rational](rational.md)

Sometimes, a simple idea leads to very interesting projects.
This article will detail the reasons of the creation of [REserve](https://www.npmjs.com/package/reserve) best described as a **lightweight** web server statically **configurable** with regular expressions that can also be **embedded** and **extended**.

## [Technical details](technical%20details.md)

Based on a **clean concept**, the development of [REserve](https://www.npmjs.com/package/reserve) follows a **simple architecture** that enables **flexibility** and **extensibility**. This article provides keys to understand the **modular structure** of the implementation.

## [Tests & Quality](tests%20and%20quality.md)
After drafting the first working version of [REserve](https://npmjs.com/package/reserve), **behavior validation** and **quality assessment** were some of the remaining **challenges**. This article will detail the different **strategies** adopted for **testing** as well as the **tooling** used to ensure the **quality** of the project.

## [Serving an OpenUI5 application](openui5.md)

The best way to explain **what REserve can do** is to demonstrate some of its features through a **concrete use case**.
In this article, we will illustrate how one can quickly setup a server to **facilitate the execution of OpenUI5 applications**.

## [Cache and Proxy](cache%20and%20proxy.md)

With version 1.8.0, [REserve](https://www.npmjs.com/package/reserve) offers **the capture helper** that enables the **copy of the response content while processing a request**. In this article, an example will be presented in two different flavors to illustrate the **new possibilities** introduced by this tool.
