# Tests & Quality

When it comes to web application testing, there are many ways to deal with it. On one hand, you may use [selenium-based tools](https://www.guru99.com/automated-testing-tools.html) (or [alternatives](https://www.guru99.com/selenium-alternatives.html)) to automate a browser,  run a given set of scenario and assess the expected results. On the other hand, you may leverage a simple http client *(for instance [curl](https://curl.haxx.se/) or Node.js' [request](https://www.npmjs.com/package/request))* and analyze the responses.

But, with regards to [REserve](https://www.npmjs.com/package/reserve),
the server behavior needs to be validated.
Since it is very flexible, every possible configuration should be tested and the error management should be controlled.

## Basic testing

Like many proof of concepts, the very first testing that was done consisted in creating a mappings.json file illustrating all types of mapping

mappings.json
extended by http.json, https.json
assertions.js based on gpf's http helper
index.html for browser testing
all.js for Node.js testing

## In-depth testing

Test cases are defined and executed
with mocha  


Node.js modules (fs, http, ...) mocking is possible
with [mock-require](https://www.npmjs.com/package/mock-require)  

## Continuous integration

Every push triggers a job that runs the tests and updates coverage info.
Travis https://travis-ci.org/ArnaudBuchholz/reserve

## Code coverage with Istanbul

Code coverage measurement is made simple
with [nyc](https://www.npmjs.com/package/nyc)

Results are uploaded to Coveralls platform Coveralls
https://coveralls.io/github/ArnaudBuchholz/reserve

## Code smells

Code Climate online platform performs code analysis to detect maintainability issues
https://codeclimate.com/github/ArnaudBuchholz/reserve

## Publishing

This project is my first experience
with NPM support.

The name was taken by an empty project, it has been reassigned after contacting the original owner.
