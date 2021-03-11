# Executing tests

![Parallel execution](slot-car-racing-Melbourne.jpg)

In this third article, the runner is improved to **enable the execution** of the tests *(qUnit and OPA)*. The web server is modified to **inject** hooking scripts and **new endpoints** are provided to receive the tests results. Also, a basic **execution queue** is implemented so that we can control the number of instances that are **executed simultaneously**.

## QUnit hooks

The [OPA framework](https://sapui5.hana.ondemand.com/#/topic/2696ab50faad458f9b4027ec2f9b884d) is built on top of QUnit.

Qunit hooks

* [QUnit.begin](https://api.qunitjs.com/callbacks/QUnit.begin/)
* [QUnit.testDone](https://api.qunitjs.com/callbacks/QUnit.testDone/)
* [QUnit.done](https://api.qunitjs.com/callbacks/QUnit.done/)

## Injecting QUnit hooks

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