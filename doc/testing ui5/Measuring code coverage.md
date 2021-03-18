# Measuring code coverage

![nyc](nyc.jpg)

In this last article, we explain how [nyc](https://www.npmjs.com/package/nyc) is used to **instrument the sources** and the runner is modified to handle **code coverage**. The web server **switches** between instrumented sources and the original ones *(in case one does not want to measure the coverage of specific files)*. Because of the way OPA tests are designed (and the use of **IFrames**), the instrumented files are **altered on the fly** to update their scope. Once every individual coverage information is extracted, nyc is called again to **merge** the coverage and **generate a report**.

## Fundamentals

Before jumping to the implementation details, I would like to spend some time on  **fundamentals**.

**Why do we care about measuring the code coverage ?**

We create tests to ensure that the **code behaves as expected**. We measure the code coverage to **check which lines of code** are being evaluated while executing the tests.

This helps to understand if :
* the **tests are relevant** : if the code is **not tested**, it does **not work**.
* the **code is relevant** : when **all expected features** are tested, any code that is not triggered is **useless**.

If the code coverage shows that only 10% of your code is evaluated during your tests it means that 90% of the code is either not tested or useless.

But keep in mind that having **100% code coverage** does **not** mean that your code is fully tested !

For instance :

```javascript
function div (a, b) { return a / b; }
```
*Function under test*

The following assertion will give you 100% code coverage :

```
assert.strictEqual(div(4,2), 2);
```
*Test code*

But, in reality, it says almost nothing on the tested code.

What happens in the following cases ?
* `div(1,0)`
* `div('1','b')`
* is `div(1,3) * 3` equal to `1` ?

So you must implement additional test cases to **document** and **secure** the beahviors.

> A good guideline is to start with **acceptance criterias** : test whatever is expected from a **behavior** point of view.

> That is the reason why I use to say that the coverage must reach "at least 100%" !

**How does the code coverage work ?**

There is no magic behind code coverage : it usually consists in three steps : 
1. **Instrumentation** of the code
2. **Evaluation** of the code
3. **Extraction** and consolidation of measurement

The first step rewrites the code in such a way that :
* The code behavior does **not** change *(and this is obviously **critical**)*
* While the code is executed, it keeps track of which functions, lines and conditions are evaluated.

For instance, the previous example :

```javascript
function div (a, b) { return a / b; }
```
*Source file*

Turns into *(when instrumenting with nyc)*:

```javascript
function cov_1scmxvb45(){var path="div.js";var hash="021d227dc28d530884d8c843c2806b96b01d5347";var global=new Function("return this")();var gcv="__coverage__";var coverageData={path:"div.js",statementMap:{"0":{start:{line:1,column:22},end:{line:1,column:35}}},fnMap:{"0":{name:"div",decl:{start:{line:1,column:9},end:{line:1,column:12}},loc:{start:{line:1,column:20},end:{line:1,column:37}},line:1}},branchMap:{},s:{"0":0},f:{"0":0},b:{},_coverageSchema:"1a1c01bbd47fc00a2c39e90264f33305004495a9",hash:"021d227dc28d530884d8c843c2806b96b01d5347"};var coverage=global[gcv]||(global[gcv]={});if(!coverage[path]||coverage[path].hash!==hash){coverage[path]=coverageData;}var actualCoverage=coverage[path];{// @ts-ignore
cov_1scmxvb45=function(){return actualCoverage;};}return actualCoverage;}cov_1scmxvb45();function div(a,b){cov_1scmxvb45().f[0]++;cov_1scmxvb45().s[0]++;return a/b;}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRpdi5qcyJdLCJuYW1lcyI6WyJkaXYiLCJhIiwiYiJdLCJtYXBwaW5ncyI6Inl6QkFlWTt5RkFmWixRQUFTQSxDQUFBQSxHQUFULENBQWNDLENBQWQsQ0FBaUJDLENBQWpCLENBQW9CLCtDQUFFLE1BQU9ELENBQUFBLENBQUMsQ0FBR0MsQ0FBWCxDQUFlIiwic291cmNlc0NvbnRlbnQiOlsiZnVuY3Rpb24gZGl2IChhLCBiKSB7IHJldHVybiBhIC8gYjsgfSJdfQ==
```
*Instrumented source file*

> The last part includes **source mapping** to enable debugging inside the browser.

For the second step, the tests are executed after **replacing** the **original** source files with the **instrumented** ones.

Finally, regarding the last step, code coverage tools consolidate the information in a **global javascript variable** which content can be extracted.

> By default, NYC aggregates the coverage data inside `window.__coverage__`.

## NYC

[nyc](https://www.npmjs.com/package/nyc) is a command line wrapper for [Istanbul](https://www.npmjs.com/package/istanbul), a JS code coverage tool.

The runner offers a function wrapping the **execution of the command line** and **waiting** for its termination. nyc being declared as a **depedency**, it is available inside the `node_modules` folder of the runner.

```javascript
const { join } = require('path')
const { fork } = require('child_process')

function nyc (...args) {
  const childProcess = fork(join(__dirname, '../node_modules/nyc/bin/nyc.js'), args, {
    stdio: 'inherit'
  })
  let done
  const promise = new Promise(resolve => { done = resolve })
  childProcess.on('close', done)
  return promise
}
```
*nyc wrapper*

> The code could be improved to **check for errors**.

## Instrumenting sources

The command [`nyc instrument`](https://github.com/istanbuljs/nyc/blob/master/docs/instrument.md) is used.

New parameters are added to the job :
* `covSettings` : file name of a **coverage settings** file *(default explained below)*
* `covTempDir` : **temporary directory** to store the instrumented files as well as the individual coverage files (defaulted  to `'.nyc_output'`)
* `covReportDir` : directory where to store the **coverage report** *(defaulted to `'coverage'`)*

To facilitate the option selection, the runner supports the specification of a [configuration file](https://github.com/istanbuljs/nyc#configuration-files).

A default one is provided :

```json
{
  "all": true,
  "sourceMap": false
}
```
*nyc default settings*

By default, the test files are **excluded** from the coverage report. But since the **test code must be as clean as the production code**, one may want to also measure the coverage of the **test files**. Simply create a custom `nyc.json` which 'cancel' the test folder exclusion and assign its path in `covSettings` :

```json
{
  "all": true,
  "exclude": [
    "!**/test/**"
  ],
  "sourceMap": false
}
```
*nyc settings to include test files*

The instrumentation step is triggered *before* executing the tests :

```javascript
/* ... */
  server
    .on('ready', ({ url, port }) => {
      job.port = port
      if (!job.logServer) {
        console.log(`Server running at ${url}`)
      }
      await instrument()
      executeTests()
    })
```
*Instrumenting the code before executing the tests inside the runner*

## Replacing coverage context

By default, the **object** used to aggregate coverage information is stored at the **window level**.

> To be more **precise**, nyc uses the **[Function constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function) pattern** to retreive the global context of the current host : `var global=new Function("return this")()`. In a browser, it corresponds to the current [`window`](https://developer.mozilla.org/en-US/docs/Web/API/Window) object.

Unfortunately, when running OPA tests using the **IFrame mode**, the code being executed **inside** the IFrame will aggregate the coverage information **in** the IFrame window. Meaning that whenever the **tested application is shut down** at the end of the journey, this valuable information is **lost**.

We must **change the place** where the coverage information is stored.

> This is [common issue](https://github.com/istanbuljs/istanbuljs/issues/199) and several solutions were discussed. This mechanism can be **configured** when istanbul is **integrated** in solutions like [karma](https://karma-runner.github.io/latest/index.html) (see the following [change](https://github.com/istanbuljs/istanbuljs/commit/25509c7ff31f114e7036a940ed799d6d0548b706)). However, I was **not** able to leverage these options through the nyc command line.

Another approach is to rely on REserve which offers the possibility to implement a **custom file system** in the [`file` handler](https://github.com/ArnaudBuchholz/reserve/blob/master/doc/file.md#custom-file-system). This gives the opportunity to **manipulate the file content** before it is sent to the client.

```javascript
const { promisify } = require('util')
const { readdir, readFile, stat } = require('fs')
const readdirAsync = promisify(readdir)
const readFileAsync = promisify(readFile)
const statAsync = promisify(stat)
const { Readable } = require('stream')

const globalContextSearch = 'var global=new Function("return this")();'
const globalContextReplace = 'var global=window.top;'

const customFileSystem = {
  stat: path => statAsync(path)
    .then(stats => {
      if (stats) {
        stats.size -= globalContextSearch.length + globalContextReplace.length
      }
      return stats
    }),
  readdir: readdirAsync,
  createReadStream: async (path) => {
    const buffer = (await readFileAsync(path))
      .toString()
      .replace(globalContextSearch, globalContextReplace)
    return Readable.from(buffer)
  }
}
```
*Custom file system that searches and replaces the global context definition with a custom one*

## Replacing sources with instrumented files

Now that the **instrumented files are generated** and the **coverage information is stored at the right place**, a new mapping is created to **substitute the source files with the instrumented ones**. To enable substitution, it must be inserted **before** the source mapping.

**NOTE** : `'ignore-if-not-found'` is defined to tell the handler to **not fail** the request if the file is not found *(allowing the **subsequent mapping(s)** to process the request)*.

```javascript
{
  match: /^\/(.*\.js)$/,
  file: join(instrumentedSourceDir, '$1'),
  'ignore-if-not-found': true,
  'custom-file-system': customFileSystem
}
```
*Coverage mapping*

## Extracting the code coverage

When the test page ends, the [QUnit.done](https://api.qunitjs.com/callbacks/QUnit.done/) callback is triggered. This is the perfect time to **collect** the generated coverage information.

```javascript
/* Injected QUnit hooks */
(function () {
  'use strict'

  function post (url, data) {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/_/' + url)
    xhr.send(JSON.stringify(data))
  }

  /* ... */

  QUnit.done(function (report) {
    if (window.__coverage__) {
      post('nyc/coverage', window.__coverage__)
    }
    post('QUnit/done', report)
  })
}())
```
*Modified QUnit hook to also collect coverage information*

This requires a **new endpoint** to save the information in the coverage **temporary directory**.

The runner **must wait** for the test report to be saved **before** stopping the browser. Also, it must wait for the **coverage report** to be **saved**. Hence, **two synchronization points are needed**.

A **simple pattern** to keep track of pending operations is to **chain promises**.

When the test page object is created, a member `wait` is initialized with a resolved promise. Whenever a synchronization point is expected, this member is replaced with a new promised chained with the previous one : `wait = wait.then(newPromise)`

```javascript
{
  // Endpoint to receive QUnit.begin
  match: '/_/QUnit/begin',
  custom: endpoint((url, details) => {
    job.testPages[url] = {
      total: details.totalTests,
      failed: 0,
      passed: 0,
      tests: [],
      wait: Promise.resolve()
    }
  })
}, {
  // ...
}, {
  // Endpoint to receive QUnit.done
  match: '/_/QUnit/done',
  custom: endpoint((url, report) => {
    const page = job.testPages[url]
    page.report = report
    const promise = writeFileAsync(join(job.tstReportDir, `${filename(url)}.json`), JSON.stringify(page))
    page.wait.then(promise).then(() => stop(url))
  })
}, {
  // Endpoint to receive coverage
  match: '/_/nyc/coverage',
  custom: endpoint((url, data) => {
    const page = job.testPages[url]
    const promise = writeFileAsync(join(job.covTempDir, `${filename(url)}.json`), JSON.stringify(data))
    page.wait = page.wait.then(promise)
    return promise
  })
}
```

## Generating the code coverage reports



Two steps :
- Merge individual coverage files
- Generate a report

