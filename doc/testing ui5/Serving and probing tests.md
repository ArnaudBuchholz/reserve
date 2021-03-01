# Serving and probing tests

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

Parameters are :
* `port` : the port used to serve the application *(`0` means REserve will allocate one)*
* `ui5` : the base URL of the UI5 content delivery network to use
* `command` : the command required to run the browser
* `options` : any additional options to run the browser, the url to open is replaced by the token `'${url}'`
* `keepAlive` : even after the runner ended, keep the server alive *(mostly for debugging purposes)*
* `logServer` : enables REserve logs

A very **basic parameter parsing** is implemented to offer the possibility to alter some of these settings through the **command line** (using syntax `-<parameter>:<value>`).

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

## Serving the application

To serve the application, REserve is **embedded** in the command line by **importing** the relevant functions and offering the minimum services :
* Mapping UI5 resources
* Mapping the project sources

Once the **server started**, the port is stored at the job level *(in the event REserve allocated it)*.

**NOTE** : UI5 resources are mapped by telling the browser to **load them directly from the CDN** with the [HTTP Status code 302](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302)

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

## Spawning a browser

The runner needs a fine control over the **browser instanciation**. Furthermore, since we want to execute more than one test in parallel, each instance needs to be **distinguished with a unique ID**.

**NOTE** : the function returns a promise that is **resolved** when the spawned processed **is terminated** (using `execute.kill`). The promise is 

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
  const process = spawn(job.command, job.options.split(' ').map(param => param.replace('${url}', url)), {
    detached: true
  })
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


## Defining an endpoint

As a lazy developer, I don't want to repeat the code ([DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) concept).

Hence a function is created to implememt the endpoints : it receives the request and the response, it immediately acknowledges the response, deserialize the request body and identify the the id of the submitter by looking into the [referer header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referer).

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
      console.error(e)
    }
  }
}
```