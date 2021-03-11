# Probing the tests

![7658449002_0646d75738_c.jpg](7658449002_0646d75738_c.jpg)
*Image from https://www.flickr.com/photos/emsl/7658449002/*

In this second article, we **fetch the list of test pages** by triggering a specific URL that references all the tests to execute. This will require the use of **script substitution** as well as offering an **endpoint** to receive the collected tests.

## Declaring the tests

Most of the UI5 applications have a similar testing structure : the page called `webapp/test/testsuite.qunit.html` is the entry point. Its content **declares the test pages** contained in the project. It also includes the `qunit-redirect` module which bootstraps a **web test runner** provided by UI5.

> One big projects, it is recommended to segregate the OPA tests pages *(one per journey)*. One pattern is to write a json file (named `AllJourneys.json`) containing the journeys' names and loop over it to declare as many test pages as needed.

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
*testsuite.qunit.html file example content*

When opening the `webapp/test/testsuite.qunit.html` page, a **redirection** occurs and the web test runner executes the declared tests.

![SAPUI5 QUnit TestRunner](SAPUI5%20QUnit%20TestRunner.png)
*UI5 Web test runner*

## Test suite extraction

To extract the list of test pages, we **substitute** the UI5 `qunit-redirect.js` resource with a **custom one** that **transmists the list of pages** directly to the runner.

The custom script exposes the **expected interface** and it **posts** the result list to the endpoint `/_/addTestPages`.

```javascript
(function () {
  'use strict'

  /* global suite */

  const pages = []

  function jsUnitTestSuite () {}

  jsUnitTestSuite.prototype.addTestPage = function (url) {
    if (!url.startsWith('/')) {
      url = '/' + url
    }
    pages.push(url)
  }

  window.jsUnitTestSuite = jsUnitTestSuite

  window.addEventListener('load', function () {
    suite()
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/_/addTestPages')
    xhr.send(JSON.stringify(pages))
  })
}())
```
*Custom qunit-redirect.js*

To **substitute** the module and **receive** the probing result, two new mappings are added in the REserve configuration. The received data is stored as the property `testPageUrls` on the job.

**NOTE** : the `qunit-redirect.js` substitution must be done prior to serving ui5 resources.

```javascript
{
  // Substitute qunit-redirect to extract test pages
  match: '/resources/sap/ui/qunit/qunit-redirect.js',
  file: join(__dirname, './inject/qunit-redirect.js')
}, {
  // Endpoint to receive test pages
  match: '/_/addTestPages',
  custom: endpoint((url, data) => {
    job.testPageUrls = data
    stop(url)
  })
}
```

Last but not least, once the server started, we trigger the tests extraction by executing the `testsuite.qunit.html` page :

```javascript
/* ... */
  server
    .on('ready', async ({ url, port }) => {
      job.port = port
      if (!job.logServer) {
        console.log(`Server running at ${url}`)
      }
      await start('/test/testsuite.qunit.html')
    })
```
*Trigger tests extraction once the server started*

## Next step

The job now has the **list of test pages** to execute. The next step is to **parallelize** them and **collect** the tests results.
