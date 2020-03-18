# Tests & Quality

After drafting the first version of [REserve](https://npmjs.com/package/reserve), some of the remaining **challenges** included **behavior validation** and **quality assessment**. This article will detail the different **strategies** adopted for **testing** as well as the **tooling** used to ensure the **quality** of the project.

## Basic testing

There are many ways to deal with web application testing. On one hand, you may use one of the [selenium-based tools](https://www.guru99.com/automated-testing-tools.html) (or any [alternative](https://www.guru99.com/selenium-alternatives.html)) to **automate a browser**, run a given set of **scenarios** and assess the **expected results**. On the other hand, you may leverage a simpler **http client** *(for instance [curl](https://curl.haxx.se/) or Node.js' [request](https://www.npmjs.com/package/request))* and **analyze the responses**.

With regards to this project, the most important thing is to validate the way the **server behaves** according to its configuration. Since it is very **flexible**, every possible combination should be tested and the error management should be finely controlled.

When the project started, an initial - not to say basic - test was created by building a **small website illustrating most of the features**. First, a [mappings.json](https://github.com/ArnaudBuchholz/reserve/blob/master/tests/mappings.json) file contains a mix of different handlers and mappings. Then, two additional files extend this definition to  expose it through [http](https://github.com/ArnaudBuchholz/reserve/blob/master/tests/http.json) and [https](https://github.com/ArnaudBuchholz/reserve/blob/master/tests/https.json).

```json
{
  "mappings": [{
    "match": "^/proxy/(https?)/(.*)",
    "url": "$1://$2",
    "unsecure-cookies": true
  }, {
    "match": "^/echo/(.*)$",
    "custom": "./echo.js"
  }, {
    "match": "^/chrome/(.*)$",
    "custom": "./chrome.js"
  }, {
    "match": "^/gpf\\.js$",
    "file": "../node_modules/gpf-js/build/gpf.js"
  }, {
    "match": "(.*)",
    "file": "./$1"
  }]
}
```
<u>*Initial mappings used to prototype REserve*</u>

```json
{
  "extend": "./mappings.json",
  "port": 5000
}
```
<u>*http.json file used to expose mappings through http*</u>

A [web page](https://github.com/ArnaudBuchholz/reserve/blob/master/tests/index.html) is designed to leverage the different mappings and the result is validated with a list of [assertions](https://github.com/ArnaudBuchholz/reserve/blob/master/tests/assertions.js) *(thanks to the [gpf-js http](https://arnaudbuchholz.github.io/gpf/doc/gpf.http.html) helper)*.

![test result](localhost_5000.png)
<u>*Basic tests executed in a browser*</u>

However, this can hardly be **automated** *(or I am too lazy to use selenium)*.

This is the reason why the **Node.js command line** [all.js](https://github.com/ArnaudBuchholz/reserve/blob/master/tests/all.js) was introduced.

 It **runs** the different configuration files *(http & https)* by creating a **child process** with [child_process.fork](https://nodejs.org/api/child_process.html#child_process_child_process_fork_modulepath_args_options) and relies on REserve's [parent process notification feature](https://github.com/ArnaudBuchholz/reserve/blob/master/index.js#L41) to wait for the server startup. Once synchronized, it **executes all the assertions** and then **stops** the server *(by killing the process)*.

## In-depth testing

The previous approach consisted in considering the **whole project** as a standalone - monolithic - component and test it by leveraging **a client**. This is also known as **end to end testing**. If you understand the **[pyramid of test](https://martinfowler.com/articles/practical-test-pyramid.html)**, we are almost on the top of it... Meaning that this should be the place where the least effort is being put.

Another angle for testing is to **isolate each class and service** by [mocking or stubbing](https://www.martinfowler.com/articles/mocksArentStubs.html#TheDifferenceBetweenMocksAndStubs) their dependencies and **test them individually**. This is known as **unit testing**.



The [mocha framework](https://www.npmjs.com/package/mocha) was chosen for its simplicity.
For each source file of the project a corresponding test file is created.

![Mocha execution excerpt](mocha%20tests%20%28excerpt%29.png)
<u>*Mocha execution excerpt*</u>


It is possible to mock Node.js modules (such as fs, http, ...) using [mock-require](https://www.npmjs.com/package/mock-require). This tools allows you to predefine a module particular mocked object

### Mocking the file system

Talk about windows / unix differences
Only the required APIs are mocked

### Mocking of requests & responses

Streams !

## Continuous integration

Every push triggers a job that runs the tests and updates coverage info.
Travis https://travis-ci.org/ArnaudBuchholz/reserve

## Code coverage with Istanbul

Code coverage measurement is made simple
thanks to [nyc](https://www.npmjs.com/package/nyc)

Results are uploaded to and memorized by Coveralls platform Coveralls
https://coveralls.io/github/ArnaudBuchholz/reserve

npm run cover and a sample output

## Code smells

Code Climate online platform performs code analysis to detect maintainability issues
https://codeclimate.com/github/ArnaudBuchholz/reserve

## Publishing

This project is my first experience
with NPM support.

The name was taken by an empty project, it has been reassigned after contacting the original owner.
