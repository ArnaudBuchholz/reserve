# Serving an OpenUI5 application

The best way to explain **what REserve can do** is to demonstrate some of its features through a **concrete use case**.
In this article, we will illustrate how one can quickly setup a server to **facilitate the development of OpenUI5 applications**.

## Quick presentation of OpenUI5

### Overview

![UI5](https://raw.githubusercontent.com/SAP/ui5-tooling/master/docs/images/UI5_logo_wide.png)

[OpenUI5](https://openui5.org/) is a **free** and **open source** JavaScript framework to develop **enterprise-grade** and **responsive** applications.

It offers some **efficient** development concepts, such as :
* The Model View Controller (**MVC**) pattern
* **XML** definition of views
* Two-way **bindings**
* Controls development with **fast rendering**
* ODATA integration
* Testing helpers (qUnit / [OPA](https://youtu.be/HiZq-kuIbt0))
* ...

More information can be found in [the documentation](https://openui5.hana.ondemand.com/).

### Building an OpenUI5 application

The community around the framework is **growing** and **several tools** are publicly available in the [NPM repository](https://www.npmjs.com/search?q=openui5).

In particular, when it comes to building an application, you must add the following NPM packages to your project :

* [@ui5/cli](https://www.npmjs.com/package/@ui5/cli) : it contains the required **[tooling](https://github.com/SAP/ui5-tooling#ui5-tooling) to initiate, serve and build your application**.<br />It cumulates [27 MB](https://packagephobia.now.sh/result?p=@ui5/cli) of files *(including dependencies)*.

* [@openui5/sap.ui.core](https://www.npmjs.com/package/@openui5/sap.ui.core) : this is the UI5 **core runtime**.<br /> It takes [26.4 MB](https://packagephobia.now.sh/result?p=@openui5/sap.ui.core).

* [@openui5/sap.m](https://www.npmjs.com/package/@openui5/sap.m) : this is the main UI5 control library, with responsive controls that can be used in touch devices as well as desktop browsers.<br /> It weights [10.2 MB](https://packagephobia.now.sh/result?p=@openui5/sap.m).

* [@openui5/themelib_sap_fiori_3](https://www.npmjs.com/package/@openui5/themelib_sap_fiori_3) : the default theme *(including specific fonts)*. <br /> It requires [4.2 MB](https://packagephobia.now.sh/result?p=@openui5/themelib_sap_fiori_3).

In the end, you basically need a total of **60 MB of packages** to start coding your application. Such a **digital footprint is quite common** for a standard Node.js development environment in which you can handle the **full lifecycle of your application** (serving, validating, minifying...).

Once the **application is finalized**, depending on **its dependencies**, the deployment will live in a **fraction of this size**.

There is one **little drawback** to this model. After installing all these packages, the project is **bound to the downloaded version of OpenUI5**. Since a new release of UI5 is done almost **every month**, it might be interesting to **switch between versions**.

However, this means **cleaning the package list and install new ones**.

That can be a **tedious process** but, good news, the [version 2 of the cli tools](https://youtu.be/v6ImEbZRRlg) offers a mechanism to **simplify** it.

### OpenUI5 Content Delivery Network

The framework is built on top of a [smart dependency management model](https://openui5.hana.ondemand.com/api/sap.ui#methods/sap.ui.define) that is capable of loading the missing dependencies when needed. To put it in a nutshell, these **additional modules** are usually **relative to the location where the [UI5 bootstrap](https://openui5.hana.ondemand.com/1.76.0/resources/sap-ui-core.js)** is obtained.

Furthermore, each released version of UI5 is available from the public CDN:
* 1.76.0 is available under [https://openui5.hana.ondemand.com/1.76.0/resources/](https://openui5.hana.ondemand.com/1.76.0/resources/sap-ui-version.json)
* 1.75.0 is available under [https://openui5.hana.ondemand.com/1.75.0/resources/](https://openui5.hana.ondemand.com/1.75.0/resources/sap-ui-version.json)
* 1.74.0 is available under [https://openui5.hana.ondemand.com/1.74.0/resources/](https://openui5.hana.ondemand.com/1.74.0/resources/sap-ui-version.json)
* ...

## Sample application

Let's consider a **simple demonstration application** that consists in one view and one button. The **current version of OpenUI5** is displayed in the title.

![sample app](openui5/sample%20app.png)

As explained before, the UI5 framework is loaded from the CDN.

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OpenUI5 Demo App</title>
  <script id="sap-ui-bootstrap"
    src="https://openui5.hana.ondemand.com/1.76.0/resources/sap-ui-core.js"
    data-sap-ui-theme="sap_fiori_3"
    data-sap-ui-libs="sap.m"
    data-sap-ui-resourceroots='{"Demo": "./"}'
    data-sap-ui-onInit="module:Demo/index"
    data-sap-ui-compatVersion="edge"
    data-sap-ui-async="true">
  </script>
</head>
<body class="sapUiBody" id="content"></body>
</html>
```
If  opening this file in the browser, the application does not load.

![static](openui5/file%20access.png)

>>>>> TODO

### REserve to the rescue

Installation:
`npm install reserve -g`

![File access](openui5/file%20access.png)

## Variations of the UI5 version

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OpenUI5 Demo App</title>
  <script id="sap-ui-bootstrap"
    src="./resources/sap-ui-core.js"
    data-sap-ui-theme="sap_fiori_3"
    data-sap-ui-libs="sap.m"
    data-sap-ui-resourceroots='{"Demo": "./"}'
    data-sap-ui-onInit="module:Demo/index"
    data-sap-ui-compatVersion="edge"
    data-sap-ui-async="true">
  </script>
</head>
<body class="sapUiBody" id="content"></body>
</html>
```
