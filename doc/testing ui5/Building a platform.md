# Building a platform

![Platform](platform.jpg)

In this first article, we setup the runner by building a **configurable platform** that serves the web application and offers **basic services**.

## Defining and configuring a job

To centralize the different **parameters** of the runner, a **job object** is defined with a list of properties.

```javascript
const job = {
  cwd: process.cwd(),
  port: 0,
  ui5: 'https://ui5.sap.com/1.87.0',
  webapp: 'webapp',
  logServer: false
}
```
*Job definition with named parameters*

The list of parameters will be **changed** while covering the different steps but we begin with :
* `cwd` : the current **working directory**, it is initialized with the [process current one](https://nodejs.org/api/process.html#process_process_cwd)
* `port` : the port used to serve the application *(`0` means REserve will allocate one)*
* `ui5` : the base URL of the content delivery network to grab UI5 from
* `webapp` : the webapp directory of the application to serve 
* `logServer` : enables REserve logs

A very **basic parameter parsing** offers the possibility to alter some of these settings through the **command line** (using syntax `-<parameter>:<value>`).

```javascript
process.argv.forEach(arg => {
  const valueParsers = {
    boolean: value => value === 'true',
    number: value => parseInt(value, 10),
    default: value => value
  }

  const parsed = /-(\w+):(.*)/.exec(arg)
  if (parsed) {
    const [, name, value] = parsed
    if (Object.prototype.hasOwnProperty.call(job, name)) {
      const valueParser = valueParsers[typeof job[name]] || valueParsers.default
      job[name] = valueParser(value)
    }
  }
})
```
*Basic parsing enabling parameter setting from the command line*

Last but not least, all the parameters that relate to paths are made **absolute** to simplify file handling.

```javascript
const { isAbsolute, join } = require('path')

function toAbsolute (member, from = job.cwd) {
  if (!isAbsolute(job[member])) {
    job[member] = join(from, job[member])
  }
}

toAbsolute('cwd', process.cwd())
toAbsolute('webapp')
```
*Making all path-like parameters absolute*

## Serving the application

To serve the tested web application, REserve is **embedded** in the runner by **importing** the relevant functions and exposing two kind of mappings :
* UI5 resources
* The project sources

Once the **server started**, the port is stored at the job level *(in the event REserve allocated it)*.

```javascript
const { join } = require('path')
const ui5 = require('./src/ui5')
const { check, log, serve } = require('reserve')

const job = require('./src/job')

async function main () {
  const configuration = await check({
    port: job.port,
    mappings: [
      ...ui5, {
        // Project mapping
        match: /^\/(.*)/,
        file: join(job.webapp, '$1')
      }]
  })
  const server = serve(configuration)
  if (job.logServer) {
    log(server)
  }
  server
    .on('ready', async ({ url, port }) => {
      job.port = port
      if (!job.logServer) {
        console.log(`Server running at ${url}`)
      }
    })
}

main()
```

Regarding ui5 resources, this first version simply **proxifies** the UI5 content delivery repository using REserve's `url` handler.

> For **perfomance** reasons and to support **additional resources** such as libraries, the UI5 mappings will become more complex. This will be detailled in a separate article and it explains why the definition is isolated.

```javascript
'use strict'

const job = require('./job')

const mappings = [{
  // UI5 from url
  method: ['GET', 'HEAD'],
  match: /\/((?:test-)?resources\/.*)/,
  url: `${job.ui5}/$1`
}]

module.exports = mappings
```

> So far, we have a functional and configurable web server capable of serving UI5 applications. You may download the [consolidated source](serving.js) and play with it *(don't forget to install [REserve](https://www.npmjs.com/package/reserve))*.

## Spawning a browser

In order to **execute the tests**, the runner requires the ability to **instantiate browsers**. Furthermore, it will execute several ones to **parallelize** the tests. It means that we need a way to **identify** which browser executes which test.

The browser execution  is **delegated** to a separate **Node.js script**. It means that the runner will expose two new parameters :

* `browser` : the path of a Node.js script that is responsible of starting the browser. By default, a [script](https://github.com/ArnaudBuchholz/ui5-test-runner/blob/main/defaults/chromium.js) leveraging [puppeteer](https://developers.google.com/web/tools/puppeteer) is provided.
* `args` : parameters for the script. Two tokens can be used to inject specific values :
  - `__URL__` : contains the URL of the test page to execute
  - `__REPORT__` : contains the path to a folder where the script can save additional information related to the test execution *(such as console logs or screenshots)*

Two new APIs exposes the service internally :
* `start (relativeUrl)`
* `stop (relativeURl)`

The first one **executes** the script and keep track of the **[forked](https://nodejs.org/api/child_process.html#child_process_child_process_fork_modulepath_args_options) process**. The second one [sends a message to the process](https://nodejs.org/api/child_process.html#child_process_subprocess_send_message_sendhandle_options_callback) to **request its end**. The `start` API returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) that is **resolved** when the corresponding `stop` API has been called.

It means that the test **page URL** is used as a **key** to identify the browsers. Whenever the browser triggers an **endpoint** exposed by the platform, it reads the **[referer header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referer)** to capture the URL and **identify** the browser / test being executed.

This service is implemented in the [`browsers` module](https://github.com/ArnaudBuchholz/ui5-test-runner/blob/main/src/browsers.js)

## Defining an endpoint

During the tests execution, the runner **needs endpoints** to receive **feedback** from the spawned browsers.

As a lazy developer, I don't want to repeat myself ([DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) concept). Hence a function is used to generate these endpoints : it immediately **acknowledges** the response, **captures the URL** of the browser by reading the [referer header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referer) and **deserializes** the **request body**.

The **endpoint factory** takes a **callback** *(named `implementation`)* that is called with the **browser url** and the received **JSON data**.

```javascript
const { body } = require('reserve')

function endpoint (implementation) {
  return async function (request, response) {
    response.writeHead(200)
    response.end()
    const [, url] = request.headers.referer.match(/http:\/\/[^/]+(?::\d+)?(\/.*)/)
    const data = JSON.parse(await body(request))
    try {
      await implementation.call(this, url, data)
    } catch (e) {
      console.error(`Exception when processing ${url}`)
      console.error(data)
      console.error(e)
    }
  }
}
```
*Endpoint generation helper*

## Next steps

The platform is now **ready to execute** the tests. The next step is to **extract** them.