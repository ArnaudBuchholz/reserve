# Testing UI5

After writing an article on how REserve could be used to [serve an Open UI5 application](../openui5.md), 

In my daily work, I write lots of tests and the biggest applications I have been involved with may take up to 45 minutes to execute.
In the current pipeline implementation, all the tests are executed sequentially in the same browser window. This model is not scalable because the more tests, the slower the execution and also the javascript language being garbage collected the memory can grow very quickly (which  slows down the execution even faster).

So my idea was to enable the test execution in an environemnt where :
- the text would be no more sequential but parallel
- recycling the browser window in a regular basis to makee sure the tests run in a fresh environment

In this serie of articles, I would like to present a solution that I designed to run all the tests contained in an Open UI5 application and also take coverage measurement.
The goal is to make sure that the execution collects all the information about the running tests (such as the test names, success failure and execution) as well as coverage information.

Ideally, we want the tests to be fast so the solution should also propose a way to parallelize the tests

This little experiment is actually a really good example of what REserve can offer in terms of flexibility


* Serving and probing tests : in this first article, I will setup the basic server and leverage one page that contains all the tests to execute in order to extract them. This will require the use of script substitution as well as offering an endpoint to receive the extracted scripts

* Executing tests : in this second article, the basic setup will be improved to enable the execution of the tests (qUnit and OPA). To achieve that, the platform will be modified to inject some script and new endpoints will be provided to receive tests results. Also,  the management of the execution queue will be handled so that we can control the number of instances that are executed simultaneously

* Measuring code coverage : the last article will explain how nyc is used to instrument the sources, REserve is modified to not only substitute the instrumneted source instead of the original one but also, those sources will require a little update because of the way OPA tests are designed (using iframes. Once all the measurements are extracted ,nyc will be used to merge the coverage and generate a report.

Disclaimer : this article provides details about a proof of concept. The code is far from being perfect (and can surely be improved).