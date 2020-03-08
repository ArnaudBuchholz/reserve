# Tests & Quality

How do you test a web server ?
One basic option consists in creating a website and open a browser to it
But this can hardly be automated.

## Basic testing

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
