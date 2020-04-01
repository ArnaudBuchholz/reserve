# Serving an OpenUI5 application

The best way to explain **what REserve can do** is to demonstrate some of its features through a **concrete use case**.
In this article, we will illustrate how one can quickly setup a server to **facilitate the development of OpenUI5 applications**.

## Quick overview of OpenUI5

![UI5](https://raw.githubusercontent.com/SAP/ui5-tooling/master/docs/images/UI5_logo_wide.png)

[OpenUI5](https://openui5.org/) is a **free** and **open source** JavaScript framework to develop **enterprise-grade** and **responsive** applications.

It implements some **standard** key concepts, such as :
* The Model View Controller (**MVC**) pattern
* **XML** definition of views
* Two-way **bindings**
* Controls development with **fast rendering**

A CDN is provided
you access the latest version by bootstraping your app with
https://openui5.hana.ondemand.com/resources/sap-ui-core.js

The community is growing and several tools are provided to help with the application development.
https://www.npmjs.com/search?q=openui5

In particular, if you want to build an application, you may get at least the following NPM packages locally :

* [@ui5/cli](https://www.npmjs.com/package/@ui5/cli) : it contains the required tooling to serve and build your application. It cumulates [27 MB](https://packagephobia.now.sh/result?p=@ui5/cli) of dependencies.
* [@openui5/sap.ui.core](https://www.npmjs.com/package/@openui5/sap.ui.core) : this is the core namespace of UI5. It takes [26.4 MB](https://packagephobia.now.sh/result?p=@openui5/sap.ui.core).
* [@openui5/sap.m](https://www.npmjs.com/package/@openui5/sap.m) : this is the responsive namespace of  which requires [10.2 MB](https://packagephobia.now.sh/result?p=@openui5/sap.m) to install
* [@openui5/themelib_sap_fiori_3](https://www.npmjs.com/package/@openui5/themelib_sap_fiori_3) which requires [4.2 MB](https://packagephobia.now.sh/result?p=@openui5/themelib_sap_fiori_3) to install

So roughly a total of 60 MB to develop the app... and then you are bound to the version of OpenUI5 you downloaded. If you want to switch the version, you have to clean the package list and install a new one.

## Quick overview of OpenUI5




Installation:
`npm install reserve -g`

## The sample application

## Opening the file

![File access](openui5/file%20access.png)

## Static web site
