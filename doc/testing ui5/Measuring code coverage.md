# Measuring code coverage

![nyc](nyc.jpg)

In this last article, we explain how [nyc](https://www.npmjs.com/package/nyc) is used to **instrument the sources** and the runner is modified to handle **code coverage**. The web server **switches** between instrumented sources and the original ones *(in case one does not want to measure the coverage of specific files)*. Because of the way OPA tests are designed (and the use of **IFrames**), the instrumented files are **altered on the fly** to update their scope. Once every individual coverage information is extracted, nyc is called again to **merge** the coverage and **generate a report**.

## NYC

[nyc](https://www.npmjs.com/package/nyc) is a command line wrapper for [Istanbul](https://www.npmjs.com/package/istanbul), a JS code coverage tool.

To understand how the code coverage works, we need to get back to **fundamentals** : why do we care about measuring it ? The goal is to quantify how many lines of code are being evaluated while executing the tests. This helps to understand if the tests are relevant.

For instance, if you figure out that only 10% of your code was evaluated during your tests it means that 90% of the code is either not tested or useless.

On the other hand, having 100% code coverage does not mean that your code is fully tested. Always keep in mind this simple example :

```javascript
function div (a, b) { return a / b; }

assert.strictEqual(div(4,2), 2);
```

The assertion will give you 100% code coverage but says almost nothing on the code under tests, what happens in the following cases :
* `div(1,0)`
* `div('1','b')`
* `div(1,3) * 3 === 1`



This operation is done while executing the tests, it means that the tool must find a way to add information in the code to keep track of which lines were evaluated. This step is called instrumenting.

During the execution, this additional code consolidates the information in one global object.

When the tests are done, this object can be extracted and the tool usually provides a way to generate a report out of it.

Branch testing

## Triggering NYC commands

NYC being a command line wrapper, the runner offers a new service to call it. NYC is declared as a depedency of the runner, as a result, it is available inside `node_modules`

the `nyc` function wraps the execution of the command line and waits for its termination

> code could be improved to test for status code

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

## Instrumenting sources

NYC default settings
```json
{
  "all": true,
  "exclude": [
    "!**/test/**"
  ],
  "sourceMap": false
}
```

>>> put sourceMap to true and show a screenshot of the debugger


## Replacing coverage context

REserve offers the possibility to use custom file systems

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

