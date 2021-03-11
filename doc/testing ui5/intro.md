# Testing UI5

## Context

As a software developer, I write code *(a lot !)*.

As a [TDD](https://en.wikipedia.org/wiki/Test-driven_development) addict *and because I don't want to [ship s#!+](https://www.artima.com/weblogs/viewpost.jsp?thread=7588)*, this code is **always preceeded by tests**.

When working with the [UI5 framework](https://openui5.org/), the recommendation for testing is to use either **QUnit** or **OPA**.

These two frameworks are used to cover the three lower stacks of the [**test pyramid**](https://martinfowler.com/articles/practical-test-pyramid.html) : unit, component and integration testing. This is usually the location where the the **testing is focused**. Everything is already written down in the book [Testing SAPUI5 Applications](https://www.sap-press.com/testing-sapui5-applications_5056/).

> This article presents the point of view of the developer working on the UI side. To be complete and cover **more stages of the test pyramid**, one also needs to consider end-to-end, application and scenario testing. To achieve these tests, [UIVeri5](https://github.com/SAP/ui5-uiveri5) can be used.

The beauty of QUnit and OPA is that they only require a browser to **execute the tests**. Hence the minimal work environment of an UI5 developer is composed of an **editor**, a **browser** and a **web server**. Regarding the last point, UI5 provides [command line tools](https://sap.github.io/ui5-tooling/pages/CLI/) to serve the application.

![OPA tests](OPA%20tests.png)
*OPA tests results*

In case you missed it, and because the rest of the article assumes you already know it, I documented an **alternate solution** on how REserve could be used to [serve an Open UI5 application](../openui5.md).

## Continuous integration

Once the code is tested, linted and reviewed, it goes to the **continuous integration pipeline**.

In this context, the game is **different**.

Indeed, to execute the tests, the pipeline needs a tooling that is capable of **serving** the application, opening a **browser**, piloting the **test execution** and **consolidating** the results. Furthermore, this process is usually the place where the **code coverage is measured**.

Last but not least, a **report** is generated to let the developer know the **execution status**. Actually, the report is crucial when the **tests fail** : the developer needs a maximum of information to **fix the problems**.

By default, the UI5 tooling proposes a solution based on [karma](https://karma-runner.github.io/latest/index.html). In the current implementation, all the tests are executed **sequentially** in the **same** browser window.

![UI5 karma runner](UI5%20karma%20runner.png)
*UI5 karma runner in action*

Unfortunately, on **very big projects** this model appears to not **scale** properly. Indeed, the combination of **iframes** in the OPA tests and the **extra memory** needed to collect the code coverage generates **leaks that accumulate** over time.

This may lead the browser to **crash**.

> We are talking of complex projects with a huge test suite that takes more than 45 minutes to execute.

So I wanted to investigate a **different approach** and enable the tests execution in an environment where :
- By **splitting** the QUnit tests and the different OPA journeys, the tests would be no more sequential but **parallel**. 
- By using **one** browser window **per** test, it limits the consequences of memory leaks and **reduces** the risk of crash.

## A new test runner

In this serie of articles, we will detail **step by step** the solution that was prototyped to run all the tests contained in an UI5 application and also take coverage measurement.

To properly generate the report, we have to make sure that the runner **collects** all the information about the different tests *(such as the test names, success, failure and execution)* as well as **individual coverage** information.

> This little experiment actually demonstrates some interesting **features of REserve** as it shows how **complex problems** can be solved with very **little code**.

> **Disclaimer** : these articles provide details about a proof of concept. The code is far from being perfect and it can surely be improved.

* [**Building a platform**](Building%20a%20platform.md) : in this first article, we setup the runner by building a **configurable platform** that serves the web application and offers **basic services**.

* **Probing tests** : in this second article, we **fetch the list of test pages** by triggering a specific URL that references all the tests to execute. This will require the use of **script substitution** as well as offering an **endpoint** to receive the collected tests.

* **Executing tests** : in this third article, the runner will be improved to **enable the execution** of the tests *(qUnit and OPA)*. The web server will be modified to **inject** hooking scripts and **new endpoints** will be provided to receive the tests results. Also, a basic **execution queue** will be implemented so that we can control the number of instances that are **executed simultaneously**.

* **Measuring code coverage** : in this last article, we will explain how [nyc](https://www.npmjs.com/package/nyc) is used to **instrument the sources** and the runner is modified to handle **code coverage**. The web server will **switch** between instrumented sources and the original ones *(in case one does not want to measure the coverage of specific files)*. Because of the way OPA tests are designed (and the use of **IFrames**), the instrumented files will be **updated on the fly** to update their scope. Once every individual coverage information is extracted, nyc will be called again to **merge** the coverage and **generate a report**.
