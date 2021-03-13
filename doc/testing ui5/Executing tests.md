# Executing tests

![Parallel execution](slot-car-racing-Melbourne.jpg)

In this third article, the runner is improved to **enable the execution** of the tests *(qUnit and OPA)*. The web server is modified to **inject** hooking scripts and **new endpoints** are provided to receive the tests results. Also, a basic **execution queue** is implemented so that we can control the number of instances that are **executed simultaneously**.

## QUnit hooks

The [OPA framework](https://sapui5.hana.ondemand.com/#/topic/2696ab50faad458f9b4027ec2f9b884d) is built **on top of [QUnit](https://qunitjs.com/)**. Developped by [John Resig](https://www.linkedin.com/in/jeresig/), the **QUnit framework** was originally built to test [jQuery](https://jquery.com/). In 2008, it became a **standalone project** and, since, it is widely used.

Because of its **popularity**, the library offers a variety of features and, in particular, it exposes some **hooks to monitor the tests execution** :

* [QUnit.begin](https://api.qunitjs.com/callbacks/QUnit.begin/) : triggers a callback whenever the **test suite begins**
* [QUnit.testDone](https://api.qunitjs.com/callbacks/QUnit.testDone/) : triggers a callback whenever a **test ends**
* [QUnit.done](https://api.qunitjs.com/callbacks/QUnit.done/) : triggers a callback whenever the **test suite ends**

Each hook provides **information about the current event**. For instance, when the test suite begins, an object containing the **number of tests** to execute (member `totalTests`) is passed to the callback. The same way, when a test ends, the parameter contains information about the number of passed (member `passed`) and failed (member `failed`) **assertions**.

As we run the tests by starting a browser with the test page URL, it is possible to monitor the execution by leveraging the hooks.

Using dedicated endpoints, we can send back this information to the runner.

```javascript
(function () {
  'use strict'

  function post (url, data) {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/_/' + url)
    xhr.send(JSON.stringify(data))
  }

  QUnit.begin(function (details) {
    post('QUnit/begin', details)
  })

  QUnit.testDone(function (report) {
    post('QUnit/testDone', report)
  })

  QUnit.done(function (report) {
    post('QUnit/done', report)
  })
}())
```
*[QUnit hooks](https://github.com/ArnaudBuchholz/ui5-test-runner/blob/main/src/inject/qunit-hooks.js) to monitor the tests execution*

## Injecting QUnit hooks

The only problem is to find a way to **inject these hooks**.

The implemented solution is close to script substitution but with a twist : when the test page **requests the qunit resource**, we **concatenate** it with the hooks.

This part is tricky and involves **different mechanisms** offered by REserve.

First of all, the qunit resource is part of the UI5 delivery, it may be either :
* version 1 : https://openui5.hana.ondemand.com/resources/sap/ui/thirdparty/qunit.js
* version 2 : https://openui5.hana.ondemand.com/resources/sap/ui/thirdparty/qunit-2.js

The regular expression `/\/thirdparty\/(qunit(?:-2)?\.js)/` matches both.

Then, REserve can publish any **local file** using the `file` handler. The lazy me doesn't want to read a file using [fs API](https://nodejs.org/api/fs.html) so a mapping is declared to make the qunit hooks source available on the URL `/_/qunit-hooks.js`.

Finally, when a request hits `thirdparty/qunit.js` or `thirdparty/qunit-2.js` :
* Two new requests are created : one to get the qunit resource (`ui5Request`, the same URL is used) and the other one to read the hooks (`hooksRequest` on `/_/qunit-hooks.js`).
* They are processed **internally** with the **[`dispatch` helper](https://github.com/ArnaudBuchholz/reserve/blob/master/doc/iconfiguration.md#async-dispatch-request-response)**.
* To avoid an infinite loop *(and ensure that the UI5 resource is being retreived)*, the request `ui5Request` is flagged with a member `internal` set to `true`. The mapping will ignore it.
* Once the internal responses are obtained, the final one is built by **concatenating the two results**.

This mapping must be applied **before** the UI5 one(s).

```javascript
const { Request, Response } = require('reserve')

/*...*/

{
  // QUnit hooks
  match: '/_/qunit-hooks.js',
  file: join(__dirname, './inject/qunit-hooks.js')
}, {
  // Concatenate qunit.js source with hooks
  match: /\/thirdparty\/(qunit(?:-2)?\.js)/,
  custom: async function (request, response, scriptName) {
    if (request.internal) {
      return // ignore to avoid infinite loop
    }
    const ui5Request = new Request('GET', request.url)
    ui5Request.internal = true
    const ui5Response = new Response()
    const hooksRequest = new Request('GET', '/_/qunit-hooks.js')
    const hooksResponse = new Response()
    await Promise.all([
      this.configuration.dispatch(ui5Request, ui5Response),
      this.configuration.dispatch(hooksRequest, hooksResponse)
    ])
    const hooksLength = parseInt(hooksResponse.headers['content-length'], 10)
    const ui5Length = parseInt(ui5Response.headers['content-length'], 10)
    response.writeHead(ui5Response.statusCode, {
      ...ui5Response.headers,
      'content-length': ui5Length + hooksLength,
      'cache-control': 'no-store' // for debugging purpose
    })
    response.write(ui5Response.toString())
    response.end(hooksResponse.toString())
  }
}
```
*Mappings to inject the hooks in the qunit resource*

## Endpoints

>>> TODO

Assuming each test page is associated with its own report object inside the runner, the QUnit hooks endpoints consists in assigning some information coming from the hook to the page.

The only exception is the hook triggered when the test suite ends. The browser execution is stopped using the `stop` API. Remember ? A promise is returned when calling `start` and this promise is resolved **when** stop is called.

When the test suite ends, we want to serialize the test page results into a file so that it can be later reused and / or consolidated in a report. To make sure that the processing does not try to access the file WHILE it is being written, we first wait for the completion of the file *before* stopping the browser.
This way, we make sure that when the promise is resolved, all the processing related to the file is stopped.

the `filename` helper is used to convert the URL into a valid filename. 

```javascript
const { promisify } = require('util')
const { writeFile } = require('fs')
const writeFileAsync = promisify(writeFile)
const { filename } = require('./tools')

/* ... */

{
  // Endpoint to receive QUnit.begin
  match: '/_/QUnit/begin',
  custom: endpoint((url, details) => {
    const page = job.testPages[url]
    Object.assign(page, {
      total: details.totalTests,
      failed: 0,
      passed: 0
    })
  })
}, {
  // Endpoint to receive QUnit.testDone
  match: '/_/QUnit/testDone',
  custom: endpoint((url, report) => {
    const page = job.testPages[url]
    if (report.failed) {
      ++page.failed
    } else {
      ++page.passed
    }
    page.tests.push(report)
  })
}, {
  // Endpoint to receive QUnit.done
  match: '/_/QUnit/done',
  custom: endpoint((url, report) => {
    const page = job.testPages[url]
    page.report = report
    const promise = writeFileAsync(join(job.tstReportDir, `${filename(url)}.json`), JSON.stringify(page))
    promise.then(() => stop(url))
  })
}
```

## Execution queue

```javascript
async function extractTestPages () {
  await start('/test/testsuite.qunit.html')
  job.testPagesStarted = 0
  job.testPagesCompleted = 0
  job.testPages = {}
  for (let i = 0; i < job.parallel; ++i) {
    runTestPage()
  }
}

async function runTestPage () {
  const { length } = job.testPageUrls
  if (job.testPagesCompleted === length) {
    return generateReport()
  }
  if (job.testPagesStarted === length) {
    return
  }

  const index = job.testPagesStarted++
  const url = job.testPageUrls[index]
  const promise = start(url)
  job.testPages[url] = {
    tests: [],
    wait: Promise.resolve()
  }

  await promise
  ++job.testPagesCompleted
  runTestPage()
}

async function generateReport () {
  /* ... */
}
```