# Probing the tests

![7658449002_0646d75738_c.jpg](7658449002_0646d75738_c.jpg)
*Image from https://www.flickr.com/photos/emsl/7658449002/*

In this second article, we **fetch the list of test pages** by triggering a specific URL that references all the tests to execute. This will require the use of **script substitution** as well as offering an **endpoint** to receive the collected tests.

## Test suite definition

## Test suite extraction

One easy way to extract the list of test pages is to **substitute** the UI5 `qunit-redirect.js` resource with a **custom one** that **transmists the list of pages** directly to the runner.

The custom script exposes the **expected interface** but it **posts** the result list to the endpoint `/_/addTestPages`.

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

To **substitute** the module and **receive** the probing result, two new mappings are added in the REserve configuration. The received data is stored as the property `_testPages` on the job.

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

Last but not least, once the server started, we trigger the call to extractPages containing :

```javascript
async function extractPages () {
  await start('test/testsuite.qunit.html')
  console.log(job._testPages)
}
```
