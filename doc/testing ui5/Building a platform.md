# Building a platform

In this first article, we setup the runner by building a **configurable platform** that serves the web application and offers **basic services**.

# Defining and configuring a job

To centralize the different **parameters** of the runner, a **job object** is defined with a list of properties.

```javascript
const job = {
  cwd: process.cwd(),
  port: 0,
  ui5: 'https://ui5.sap.com/1.87.0',
  webapp: 'webapp',
  keepAlive: false,
  logServer: false
}
```
*Job definition with named parameters*

The list of parameters will be **increased** while covering the different steps but let's start simple :
* `cwd` : the current **working directory**, it is initialized with the [process current one](https://nodejs.org/api/process.html#process_process_cwd)
* `port` : the port used to serve the application *(`0` means REserve will allocate one)*
* `ui5` : the base URL of the content delivery network to grab UI5 from
* `webapp` : the webapp directory of the application to serve 
* `keepAlive` : even after the runner ended, keep the server alive *(mostly for debugging purposes)*
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

To serve the web application, REserve is **embedded** in the runner by **importing** the relevant functions and publishing two kind of mappings :
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

Regarding ui5 mappings, this first version simply **proxify** the UI5 content delivery repository using REserve's `url` handler.

> For **perfomance** reasons and to support **additional resources** such as libraries, the UI5 mappings are more complex. This will be detailled in a separate article.

```javascript
'use strict'

const job = require('./job')

const mappings = [{
  // UI5 from url
  method: ['GET', 'HEAD'],
  match,
  url: `${job.ui5}/$1`
}]

module.exports = mappings
```

>>> So far so good, you may run this command and check that the application is visible in a browser

## Spawning a browser

The runner needs a fine control over the **browser instanciation** process. Furthermore, since it needs to execute more than one test in parallel, each instance needs to be **distinguished**.

The `start` function receives the **URL to open** as its unique argument. It returns a **promise** that is **resolved** when the spawned processed **is terminated** (using `stop`). A **unique ID** is allocated and transmitted to the browsers by adding a URL parameter. The returned promise is **augmented** with the `id` property containing the value of the allocated id.

> This is the **weakest** part of the POC. different **problems may happen** when opening the browser. Also, when the tests are running, the browser may stop **unexpectedly**. This is **not handled** here. The idea would be to offer such **monitoring features** in a separate command line and notify the runner in case of problems using a **dedicated endpoint**.

> When started through a command line, Chrome spawns another process and closes the initial one. As a result, the spawned process **leaks**. One way to tackle this behavior is to leverage automation helpers such as [selenium](https://chromedriver.chromium.org/getting-started) or [puppeteer](https://developers.google.com/web/tools/puppeteer). This wil be done **later** by offering command lines that manipulate browsers the proper way.

```javascript
const { spawn } = require('child_process')
const { randomInt } = require('crypto')

/*...*/

const instances = {}

function start (relativeUrl) {
  if (!relativeUrl.startsWith('/')) {
    relativeUrl = '/' + relativeUrl
  }
  if (relativeUrl.includes('?')) {
    relativeUrl += '&'
  } else {
    relativeUrl += '?'
  }

  const id = randomInt(0xFFFFFFFF)

  let url = `http://localhost:${job.port}${relativeUrl}__id__=${id}`
  if (job.keepAlive) {
    url += '&__keepAlive__'
  }
  console.log(url)
  const process = spawn(job.command, job.options.split(' ')
    .map(param => param
      .replace('${url}', url)
      .replace('${id}', id)
    ), { detached: true })
  let done
  const promise = new Promise(resolve => {
    done = resolve
  })
  instances[id] = { process, done }
  promise.id = id
  return promise
}

function stop (id) {
  const { process, done } = instances[id]
  delete instances[id]
  process.kill('SIGKILL')
  done()
}
```
*Start and stop helpers to control browser execution*

## Defining an endpoint

The runner will require **different endpoints** to receive **feedback** from the spawned browsers.

As a lazy developer, I don't want to repeat myself ([DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) concept). Hence a function is used to generate these endpoints : it immediately **acknowledges** the response, **deserializes** the **request body** and **identifies the id** of the browser by looking into the [referer header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referer).

It takes a **callback** *(named implementation)* that is called with the id and the JSON data.

```javascript
function endpoint (implementation) {
  return async function (request, response) {
    response.writeHead(200)
    response.end()
    const id = request.headers.referer.match(/__id__=(\d+)/)[1]
    const data = JSON.parse(await body(request))
    try {
      await implementation.call(this, id, data)
    } catch (e) {
      console.error(`Exception when processing ${request.url} with id ${id}`)
      console.error(data)
      console.error(e)
    }
  }
}
```
*Endpoint generation helper*
