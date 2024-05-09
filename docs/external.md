# External modules

Some of the settings allow the use of a string denoted as `ExternalModule` in types definition.
An external module can be either an installed package or a standalone JavaScript file.

* If the module name ends with `.mjs`, the module is expected to be an ESM file and [`import`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) is used to load it.
* Otherwise, [`require`](https://nodejs.org/api/modules.html#modules_require_id) is used to load the module. If the load fails with the exception `ERR_REQUIRE_ESM`, then [`import`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) is tried.
