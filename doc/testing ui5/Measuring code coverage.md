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

The runner offers a function wrapping the **execution of the command line** and **waiting** for its termination. nyc being declared as a depedency, it is available inside the `node_modules` folder of the runner.

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
  "exclude": [
    "!**/test/**"
  ],
  "sourceMap": false
}
```
*nyc default settings*

> By default, I also **include** the test files in the coverage report. Since the **test code must be as clean as the production code**, there is no valid reason to have a low coverage on the test files.

This step is triggered *before* executing the tests :

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

Unfortunately, when running OPA tests using the **IFrame mode**, the code being executed **inside** the IFrame will aggregate the coverage information **in** the IFrame window. Meaning that whenever the **application is shut down** at the end of the test, this valuable information is **lost**.

To avoid that, we need to **change the place** where the coverage information is stored.

> This is [common issue](https://github.com/istanbuljs/istanbuljs/issues/199) and several solutions are proposed.

REserve offers the possibility to use **custom file systems** in the [`file` handler](https://github.com/ArnaudBuchholz/reserve/blob/master/doc/file.md#custom-file-system). This gives the opportinity to **manipulate the file content**.

```javascript
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

## Replacing sources with instrumented files

A new mapping is added before the sources so that if an instrumented source exist for a given file it will be used (passing through the custom file system).

NOTE the use of `'ignore-if-not-found'` which prevents the request to fail if the file is not found, meaning the other mappings will process it

```javascript
{
  match: /^\/(.*\.js)$/,
  file: join(instrumentedSourceDir, '$1'),
  'ignore-if-not-found': true,
  'custom-file-system': customFileSystem
}
```

## Generating the code coverage reports

Two steps :
- Merge individual coverage files
- Generate a report

