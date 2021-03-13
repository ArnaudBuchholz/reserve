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

The only problem is that we must find a way to **inject these hooks**.



This part is tricky and involves different technics from REserve
(internal dispatch)

## Endpoints



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