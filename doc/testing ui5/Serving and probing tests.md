# Serving and probing tests

In this first article, we will setup the basic runner and trigger a specific page that references all the tests to execute. This will require the use of **script substitution** as well as offering an **endpoint** to receive the collected tests.

Before probing the tests, we need to **code** the base runner **services**.

> This article assumes that the runner is in a folder at the same level as the `webapp` folder.

## Defining a job

To centralize the different **parameters** of the runner, a **job object** is defined with a list of properties.

```javascript
const isWindows = (/^win/).test(process.platform)
const winChrome = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
const linuxChrome = 'google-chrome-stable'

const job = {
  port: 0, // let REserve allocate one
  ui5: 'https://openui5.hana.ondemand.com/1.87.0',
  command: isWindows ? winChrome : linuxChrome,
  options: '${url} --no-sandbox --disable-gpu --remote-debugging-port=9222 --headless',
  keepAlive: false,
  logServer: false
}
```
*Job definition*

Parameters are :
* `port` : the port used to serve the application *(`0` means REserve will allocate one)*
* `ui5` : the base URL of the UI5 content delivery network to use
* `command` : the command required to run the browser
* `options` : any additional options to run the browser, the url to open is replaced by the token `'${url}'`
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
    const name = parsed[1]
    if (Object.prototype.hasOwnProperty.call(job, name)) {
      const valueParser = valueParsers[typeof job[name]] || valueParsers.default
      job[name] = valueParser(parsed[2])
    }
  }
})
```
*Command line parameters parsing*

## Serving the application

To serve the web application, REserve is **embedded** in the command line by **importing** the relevant functions and publishing two mappings :
* UI5 resources
* The project sources

Once the **server started**, the port is stored at the job level *(in the event REserve allocated it)*.

**NOTE** : UI5 resources are mapped by instructing the browser to **load them directly from the CDN** with the [HTTP Status code 302](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302)

```javascript
const { check, log, serve } = require('reserve')
const { join } = require('path')
const rel = (...path) => join(__dirname, ...path)

/* ... */

check({
    port: job.port,
    mappings: [{
      // UI5 resources
      match: /\/(test-)?resources\/(.*)/,
      headers: {
        location: `${job.ui5}/$1resources/$2`
      },
      status: 302
    }, {
      // Project mapping
      match: /^\/(.*)/,
      file: rel('../webapp/$1')
    }]
  }))
  .then(configuration => {
    const server = serve(configuration)
    if (job.logServer) {
      log(server)
    }
    server
      .on('ready', ({ url, port }) => {
        job.port = port
      })
  })
```
*Serving the UI5 application with REserve*

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

## Declaring the tests

Now that the basic services are implemented, we can consider **extracting the tests** to execute.

Most of UI5 projects have a similar testing structure : the page called `webapp/test/testsuite.qunit.html` acts as an entry point. Its content **declares the test pages** contained in the project and it includes the `qunit-redirect` module which will bootstrap a **web test runner** provided by UI5.

> One big projects, it is recommended to split the OPA tests pages *(one per journey)*. One pattern is to write a json file (named `AllJourneys.json`) containing the journeys' names and declare as many test pages as needed.

```html
<!DOCTYPE html>
<html>
	<head>
		<title>QUnit TestSuite for OpenUI5 Todo App</title>
		<script src="../resources/sap/ui/qunit/qunit-redirect.js"></script>
		<script>

		/**
		 * Add test pages to this test suite function.
		 */
		function suite() {
			var oSuite = new parent.jsUnitTestSuite(),
				sContextPath = location.pathname.substring(0, location.pathname.lastIndexOf("/") + 1);

			oSuite.addTestPage(sContextPath + "unit/unitTests.qunit.html");

			var xhr = new XMLHttpRequest();
			xhr.open("GET", "integration/AllJourneys.json", false);
			xhr.send(null);
			JSON.parse(xhr.responseText).forEach(function (name) {
				oSuite.addTestPage(sContextPath + "integration/opaTests.qunit.html?journey=" + name);
			});

			return oSuite;
		}
		</script>
	</head>
	<body>
	</body>
</html>
```
*testsuite.qunit.html file content*

When opening the `webapp/test/testsuite.qunit.html` page, a **redirection** occurs and the web test runner goes over the tests.

![SAPUI5 QUnit TestRunner](SAPUI5%20QUnit%20TestRunner.png)
*UI5 Web test runner*

## Probing the tests

One easy way to extract the list of test pages is to **substitute** the UI5 `qunit-redirect.js` resource with a **custom one** that **posts the list of pages** directly to the runner.

```javascript
(function () {
  'use strict'

  var pages = []

  function jsUnitTestSuite () {}

  jsUnitTestSuite.prototype.addTestPage = function (url) {
    pages.push(url)
  }

  window.jsUnitTestSuite = jsUnitTestSuite

  window.addEventListener('load', function () {
    suite()
    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/_/addTestPages', false)
    xhr.send(JSON.stringify(pages))
    if (!location.toString().includes('__keepAlive__')) {
      window.close()
    }
  })
}())
```
*Custom qunit-redirect.js*

new mappings

```javascript
{
  // Substitute qunit-redirect to extract test pages
  match: '/resources/sap/ui/qunit/qunit-redirect.js',
  file: rel('qunit-redirect.js')
}, {
  // Endpoint to receive test pages
  match: '/_/addTestPages',
  custom: endpoint((id, data) => {
    job._testPages = data
    stop(id)
  })
}
```

```javascript
async function extractPages () {
  await start('test/testsuite.qunit.html')
  console.log(job._testPages)
}
```
