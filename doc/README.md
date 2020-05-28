# Documentation

## [Configuration](configuration.md)

Whether you write a `reserve.json` **configuration file** or you **embed the server** in your own application, you must define the [**properties required**](configuration.md) to run [REserve](https://www.npmjs.com/package/reserve).

## Handlers

* [`file`](file.md)
* [`url`](url.md)
* [`custom`](custom.md)
* [`use`](use.md)

The following handlers can be installed separately and plugged through the `handlers` configuration property.

| handler | description |
|---|---|
| [REserve/cache](https://www.npmjs.com/package/reserve-cache) | Caches string in memory |
| [REserve/cmd](https://www.npmjs.com/package/reserve-cmd) | Wraps command line execution |
| [REserve/fs](https://www.npmjs.com/package/reserve-fs) | Provides [fs](https://nodejs.org/api/fs.html) APIs to the browser |

If you plan to build your **own handler**, here is [what you need to know](handler.md).

## [Server events](events.md)

The [REserve](https://www.npmjs.com/package/reserve) server object implements the [EventEmitter](https://nodejs.org/api/events.html) class and throws **events with parameters** to **notify** any listener of **its activity**.

## Helpers

* [`body`](body.md)
* [`capture`](capture.md)

## [Mocking](mocking.md)

[REserve](https://www.npmjs.com/package/reserve) also includes an **helper to build tests**. It receives a **configuration** and returns a **promise** resolving to an [EventEmitter](https://nodejs.org/api/events.html) **augmented with a `request` method** to simulate incoming requests.

## [Version history](history.md)

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
