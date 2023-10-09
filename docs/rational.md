# Rational

Sometimes, a simple idea leads to very interesting projects.
This article details the reasons of the creation of [REserve](https://www.npmjs.com/package/reserve) best described as a **lightweight** web server statically **configurable** with regular expressions that can also be **embedded** and **extended**.

## Why inventing the wheel again?

If you are familiar with the **Node.js ecosystem**, you know that there are **many ways to build a web server**. From the framework based solution *(namely [express](https://www.npmjs.com/package/express))* to the turn-key command line *(for instance [serve](https://www.npmjs.com/package/serve))*, the choice is yours.

As a **lazy** - but [prolific](https://github.com/ArnaudBuchholz?utf8=%E2%9C%93&tab=repositories&q=&type=source&language=) - developer, I own many projects that require files to be available in a browser. For instance, the articles of the [gpf-js blog](http://gpf-js.blogspot.com/) are first redacted [locally](https://github.com/ArnaudBuchholz/ArnaudBuchholz.github.io/blob/master/blog/post/Release%201.0.0.html#L19) using [the markdown syntax](https://www.markdownguide.org/basic-syntax/) and then [exported to HTML](http://arnaudbuchholz.github.io/blog/post/Release%201.0.0.html) to be published. Another example, the [time sheet generation](https://github.com/ArnaudBuchholz/gen-timesheet) tool uses a [web interface](https://arnaudbuchholz.github.io/gen-timesheet/index.html) to enter the parameters...

Here is a quick overview of some selected packages that are available.

### express

* Downloads [49 M/month](https://www.npmjs.com/package/express)
* Install size [1.61 MB](https://packagephobia.now.sh/result?p=express)

Express is easily the [**most popular**](https://x-team.com/blog/most-popular-node-frameworks/) Node.js framework to **build** web applications.
It contains the necessary tools to develop a server by offering a strong **routing** mechanism and giving access to the **low level requests and responses**.
It is highly **extensible** and the most expected features of the web are implemented through [middlewares](https://www.npmjs.com/search?q=keywords:express), for instance:
* [passport](https://www.npmjs.com/package/passport): to enables authentication
* [cookie-session](https://www.npmjs.com/package/cookie-session): to implement a cookie-based session
* [cors](https://www.npmjs.com/package/cors): Cross-origin resource sharing
* ... and [more](https://www.npmjs.com/search?q=express%20middleware)

The cherry on top of the cake is [yeoman](https://yeoman.io/) that provides [hundreds of templates *(or generators)*](https://yeoman.io/generators/) to initiate a new server project.

So you might be wondering **why** I don't use express ?

First of all, the servers needed in my projects are publishing **mostly** static files. As a consequence, a very basic express server would be sufficient, like in the following example.

```javascript
const path = require('path')
const express = require('express')
const app = express()
const port = 8081
const wwwRoot = path.join(__dirname, '../www')
app.use(express.static(wwwRoot))
app.get('/', (req, res) => res.sendFile(path.join(wwwRoot, 'static.html')))
app.listen(port, () => console.log(`Listening on port ${port}!`))
```

> An example of a web server publishing static files using express

But then, this code would be **copied in each project** with a dependency to the **express package**. And, talking about dependencies, express itself requires [51 additional components](https://npm.anvaka.com/#/view/2d/express). This explains why the package contains only [204 KB](https://packagephobia.now.sh/result?p=express) of code but, in the end, has a **digital footprint of 1.61 MB**.

If you now consider licensing, express is under the [MIT license](https://opensource.org/licenses/MIT). But since it owns so many dependencies, you also have to look for **the license of each individual component** being required.

And they are not all sharing the same licensing model *(even if they are pretty close)*, as summarized below.

|License type|count|
|---|---|
|[MIT](https://opensource.org/licenses/MIT)|48|
|[ISC](https://opensource.org/licenses/ISC)|3|
|[BSD-3-Clause](https://opensource.org/licenses/BSD-3-Clause)|1|

> Licenses used in express

Whenever express is **updated**, you might need to **recheck** again the list.

### serve

* Downloads [1.1 M/month](https://www.npmjs.com/package/serve)
* Install size [3.82 MB](https://packagephobia.now.sh/result?p=serve)

On the other hand, the serve package is the perfect tool to publish static files in a **simple way**. Actually, I used it for a while before switching to REserve.

There are two ways to install and use it:

* **Globally**: after running `npm install serve --global`, the tool can be executed in any folder using the command `serve`

* **Locally** to a project: after adding the dependency with `npm install serve --save` *(or `--save-dev` if it is a development one)*, you may create an NPM script to run the tool, like in the following example.

```json
{
  "name": "your-project",
  "version": "1.0.0",
  "scripts": {
    "start": "serve"
  },
  "dependencies": {
    "serve": "^11.3.0"
  }
}
```

> Example of package.json that executes `serve` through `npm start`

It suffers from the **same drawbacks** regarding dependencies *(it is even bigger)* and licensing. But, most annoying, the tool offers **very little [configuration support](https://github.com/zeit/serve-handler#options)**.

### server.js for Node.js

* Downloads [26 k/month](https://www.npmjs.com/package/server)
* Install size [19.7 MB](https://packagephobia.now.sh/result?p=server)

This example is listed to illustrate how [uncontrollable](https://npm.anvaka.com/#/view/2d/server) dependencies may become: 218 components and 8 different licenses.

### So what?

When it comes to deliver only static files, [serve](https://www.npmjs.com/package/serve) is the simplest - yet heavy - solution.

However, there are few projects that requires more than just static files. For instance, the [GPF-JS](https://github.com/ArnaudBuchholz/gpf-js) dashboard relies on some middleware *(as explained in [this article](https://gpf-js.blogspot.com/2017/06/5-ways-to-make-http-request.html))*. Consequently it relies on the [grunt connect](https://github.com/gruntjs/grunt-contrib-connect) server *(lazy me did not want to start a specific express app)*.

Not satisfied with the current solutions, I kept this problem in the back of my head and continued working on the projects.

## Origin of REserve

Last year I had the pleasure to present at [UI5Con](https://openui5.org/ui5con/) and I introduced [node-ui5](https://www.npmjs.com/package/node-ui5): a Node.js wrapper for [UI5](https://openui5.org/) to leverage tools like [MockServer](https://openui5.hana.ondemand.com/#/api/sap.ui.core.util.MockServer) or [ODataModel](https://openui5.hana.ondemand.com/#/api/sap.ui.model.odata.v2.ODataModel).

 As a very [last part of this presentation](https://youtu.be/TB5bpvJo-zc?t=1612), a prototype demonstrates how [OPA](https://www.sap-press.com/5056/) could be used to do **end-to-end testing**. One of the key challenges is to be able to run the local test code on a remote iFrame. Because of the [same origin policy](https://en.wikipedia.org/wiki/Same-origin_policy), it is not possible. However, with the help of a **proxy that aggregates** the remote website and the local files under a unique server, it becomes possible.

 This [proxy code](https://github.com/ArnaudBuchholz/node-ui5/blob/49fddc4751921fd038da7aacddf35e6bfea3c65d/serve.js) was part of the node-ui5 project and already contained some concepts of REserve:
 * Handlers (`file`, `url` and a specific `mock` one)
 * Mappings that use regular expressions to match incoming URL

## The REserve project

At that time, the code was **small** and had very little dependencies.

I started to draft a separate [project](https://github.com/ArnaudBuchholz/reserve) that would reuse these **simple** concepts and enforced **reusability** by offering the possibility to externalize the configuration in a [JSON](https://www.json.org/json-en.html) file.

```json
{
  "port": 8080,
  "mappings": [{
    "match": "^/$",
    "file": "../www/static.html"
  }, {
    "match": "^/(.*)",
    "file": "../www/$1"
  }]
}
```

> An example of a web server publishing static files using REserve

REserve was born.
