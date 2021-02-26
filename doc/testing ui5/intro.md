# Testing UI5

## Context

As a software developer, I write code *(a lot !)*.

As a [TDD](https://en.wikipedia.org/wiki/Test-driven_development) addict *and since I don't want to [ship s#!+](https://www.artima.com/weblogs/viewpost.jsp?thread=7588)*, this code is **always preceeded by tests**.

When working with the [UI5 framework](https://openui5.org/), the recommendation for testing is to use either **QUnit** or **OPA**.

These two frameworks are used to cover the three lower stacks of the [**test pyramid**](https://martinfowler.com/articles/practical-test-pyramid.html) : unit, component and integration testing. This is usually the location where the the **testing is focused**. Everything is already written down in the book [Testing SAPUI5 Applications](https://www.sap-press.com/testing-sapui5-applications_5056/).

> This article presents the point of view of the developer working on the UI side. To be complete and cover **more stages of the test pyramid**, one also need to consider end-to-end, application and scenario testing. To achieve these tests, [UIVeri5](https://github.com/SAP/ui5-uiveri5) can be used.

The beauty of QUnit and OPA is that they only require a browser to **execute the tests**. Hence the minimal work environment of an UI5 developer is composed of an editor, a browser and a web server. Regarding the last point, UI5 provides [command line tools](https://sap.github.io/ui5-tooling/pages/CLI/) to serve the application.

In case you missed it, and because the rest of the article assumes **you already know it**, I documented an alternate solution on how REserve could be used to [serve an Open UI5 application](../openui5.md).

## Continuous integration

Once the code is tested, linted and reviewed, it goes to the continuous integration pipeline.

In this context, the game is **different**.

>>> TODO

To execute the tests, the pipeline needs a tooling that is capable of starting a browser, pilot the test execution and collect the results. Furthermore, the process can be configured to collect code coverage during the tests execution.

In the current pipeline implementation, all the tests are executed sequentially in the same browser window. This model is not scalable because the more tests, the slower the execution and also the javascript language being garbage collected the memory can grow very quickly (which  slows down the execution even faster).

So my idea was to enable the test execution in an environemnt where :
- the text would be no more sequential but parallel
- recycling the browser window in a regular basis to makee sure the tests run in a fresh environment

A little bit like I demonstrated how REserve could be used to server UI5 applications, I wanted to see how difficult it would be to implement a test runner that would :


In this serie of articles, I would like to present a solution that I designed to run all the tests contained in an Open UI5 application and also take coverage measurement.
The goal is to make sure that the execution collects all the information about the running tests (such as the test names, success failure and execution) as well as coverage information.

Ideally, we want the tests to be fast so the solution should also propose a way to parallelize the tests

This little experiment is actually a really good example of what REserve can offer in terms of flexibility


* Serving and probing tests : in this first article, I will setup the basic server and leverage one page that contains all the tests to execute in order to extract them. This will require the use of script substitution as well as offering an endpoint to receive the extracted scripts

* Executing tests : in this second article, the basic setup will be improved to enable the execution of the tests (qUnit and OPA). To achieve that, the platform will be modified to inject some script and new endpoints will be provided to receive tests results. Also,  the management of the execution queue will be handled so that we can control the number of instances that are executed simultaneously

* Measuring code coverage : the last article will explain how nyc is used to instrument the sources, REserve is modified to not only substitute the instrumneted source instead of the original one but also, those sources will require a little update because of the way OPA tests are designed (using iframes. Once all the measurements are extracted ,nyc will be used to merge the coverage and generate a report.

Disclaimer : this article provides details about a proof of concept. The code is far from being perfect (and can surely be improved).