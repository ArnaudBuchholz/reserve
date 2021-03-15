# Executing tests

![Parallel execution](slot-car-racing-Melbourne.jpg)

In this third article, the runner is improved to **enable the execution** of the tests *(qUnit and OPA)*. The web server is modified to **inject** hooking scripts and **new endpoints** are provided to receive the tests results. Also, a basic **execution queue** is implemented so that we can control the number of instances that are **executed simultaneously**.

## QUnit hooks

The [OPA framework](https://sapui5.hana.ondemand.com/#/topic/2696ab50faad458f9b4027ec2f9b884d) is a layer **on top of [QUnit](https://qunitjs.com/)**. Developped by [John Resig](https://www.linkedin.com/in/jeresig/), the **QUnit framework** was originally designed to test [jQuery](https://jquery.com/). In 2008, it became a **standalone project** and, since, it is widely used.

Because of its **popularity**, the library offers a variety of features and, in particular, it exposes some **hooks to monitor the tests execution** :

* [QUnit.begin](https://api.qunitjs.com/callbacks/QUnit.begin/) : triggers a callback whenever the **test suite begins**
* [QUnit.testDone](https://api.qunitjs.com/callbacks/QUnit.testDone/) : triggers a callback whenever a **test ends**
* [QUnit.done](https://api.qunitjs.com/callbacks/QUnit.done/) : triggers a callback whenever the **test suite ends**

Each hook provides **information about the current event**. For instance, when the test suite begins, an object containing the **number of tests** to execute (member `totalTests`) is passed to the callback. The same way, when a test ends, the parameter contains information about the number of **passed** (member `passed`) and **failed** (member `failed`) **assertions**.

As we run the tests by starting a browser with the test page URL, it is possible to **monitor the execution** by leveraging these hooks.

Using **dedicated endpoints**, we can send back this information to the runner.

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

The implemented solution is close to script substitution but with a twist : when the test page **requests the qUnit resource**, we **concatenate** it with the hooks.

This part is tricky and involves **different mechanisms** offered by REserve.

First of all, the qunit resource is part of the UI5 delivery, it may be either :
* version 1 : https://openui5.hana.ondemand.com/resources/sap/ui/thirdparty/qunit.js
* version 2 : https://openui5.hana.ondemand.com/resources/sap/ui/thirdparty/qunit-2.js

The regular expression `/\/thirdparty\/(qunit(?:-2)?\.js)/` matches both.

Then, REserve can publish any **local file** using the `file` handler. The lazy me doesn't want to read a file using [fs API](https://nodejs.org/api/fs.html) so a mapping is declared to make the qunit hooks source available on the URL `/_/qunit-hooks.js`.

Finally, when a request hits `thirdparty/qunit.js` or `thirdparty/qunit-2.js` :
* Two new requests are created : one to get the qUnit resource (`ui5Request`, the same URL is used) and the other one to read the hooks (`hooksRequest` on `/_/qunit-hooks.js`).
* They are processed **internally** with the **[`dispatch` helper](https://github.com/ArnaudBuchholz/reserve/blob/master/doc/iconfiguration.md#async-dispatch-request-response)**.
* To avoid an infinite loop *(and ensure that the UI5 resource is being retreived)*, the request `ui5Request` is flagged with a member `internal` set to `true`. The mapping ignores it when it **loops back**.
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

To **collect information** about each executed page, the runner associates an object with them. The qUnit hooks endpoinds are **filling this object**.

Members are :
* `total` : the total number of tests
* `failed` : the count of failed tests
* `passed` : the count of passed tests
* `tests` : an array aggregating the information reported by [QUnit.testDone](https://api.qunitjs.com/callbacks/QUnit.testDone/)
* `report` : the information reported by [QUnit.done](https://api.qunitjs.com/callbacks/QUnit.done/)

When the tests are done, the resulting object is **serialized for later reuse**. Once the file is generated, the browser is shut down using the `stop` API.

A new parameter is added to the job : 
* `tstReportDir` : the directory where store reports

> It is important to **wait** for the file to be written **before** calling `stop`. Indeed, a promise is returned when calling `start` and this promise is **resolved** right after `stop` is called. The **last stop** signals the end of all the tests meaning that the runner will possibily access these files.

**NOTE** : The helper `filename` converts the URL into a valid filename.

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
    job.testPages[url] = {
      total: details.totalTests,
      failed: 0,
      passed: 0,
      tests: []
    }
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
    const reportFileName = join(job.tstReportDir, `${filename(url)}.json`)
    const promise = writeFileAsync(reportFileName, JSON.stringify(page))
    promise.then(() => stop(url))
  })
}
```
*Endpoints keeping **track of tests** execution*

## Execution queue

Last but not least, the runner needs to **sequence the execution** of the tests.

A new parameter is added to the job : 
* `parallel` : the number of parallel tests allowed (default `2`)

As already explained in a previous article, once the runner embedded server started, the **probing of tests** is triggered. After getting the list of pages to execute, the runner **starts** the number of tests given by the parameter `parallel`.

The function `runTestPage` is a sort of **recursive one** that calls itself **after** the test completed.

Two job members are added to **keep track of the progress** :
* `testPagesStarted` : the number of tests ***already* started**. It also helps to know which page must be started **next**.
* `testPagesCompleted` : the number of tests **completed**. When this number equals the number of test pages, the runner knows that the tests are **over**.

> Because of the qUnit hooks, the **end** of the test will **stop** the browser which will **resolve** the promise. It means that once a browser is started, the **flow of events** will take care of the rest, explaining why the code is so **simple**.

```javascript

/* ... */
  server
    .on('ready', ({ url, port }) => {
      job.port = port
      if (!job.logServer) {
        console.log(`Server running at ${url}`)
      }
      extractTestPages()
    })

async function extractTestPages () {
  await start('/test/testsuite.qunit.html') // fills job.testPageUrls
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
    // Last test completed
    return generateReport()
  }
  if (job.testPagesStarted === length) {
    return // No more tests to run
  }
  const index = job.testPagesStarted++
  const url = job.testPageUrls[index]
  await start(url)
  ++job.testPagesCompleted
  runTestPage()
}

async function generateReport () {
  /* ... */
}
```

## Next step

The platform **executes** the tests. The next step is to **measure** code coverage.