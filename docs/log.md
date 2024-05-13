# `log` helper

[🔝 REserve documentation](README.md)

REserve offers a method to **output server events** in the standard console.

```typescript
function log (server: Server, verbose?: boolean): Server
```

> Types definition for `log`

```javascript
import { log, read, serve } from 'reserve'

read('reserve.json')
  .then(configuration => log(serve(configuration)))
```

> Example of `log`

The helper supports two modes based on the `verbose` parameter :

* When `verbose` is `false` : only a summary is generated when a request is **completed**. It includes `method`, `url` *(initial)*, `statusCode` and `timeSpent`.

```text
Server running at http://192.168.4.41:8080/
SERVE GET / 200 12 ms
SERVE GET /load-ui5.js 200 4 ms
SERVE GET /init.js 200 3 ms
SERVE GET /test/MockServer.js 200 3 ms
SERVE GET /const.js 200 3 ms
SERVE GET /test/newItem.js 200 3 ms
SERVE GET /manifest.json 200 2 ms
SERVE GET /model/metadata.xml 200 2 ms
SERVE GET /model/metadata.xml 200 3 ms
SERVE GET /model/AppConfigurationSet.json 200 3 ms
SERVE GET /model/TodoItemSet.json 200 2 ms
SERVE GET /Component-preload.js 404 2 ms
SERVE GET /Component-preload.js 404 1 ms
SERVE GET /Component.js 200 2 ms
SERVE GET /manifest.json 200 2 ms
SERVE GET /favicon.ico 404 1 ms
SERVE GET /css/styles.css 200 6 ms
SERVE GET /i18n/i18n_fr.properties 404 2 ms
SERVE GET /i18n/i18n_en.properties 404 1 ms
SERVE GET /i18n/i18n.properties 200 2 ms
SERVE GET /view/App.view.xml 200 2 ms
SERVE GET /controller/App.controller.js 200 2 ms
```

> Example of `log(...,false)` output

In case of error, a trace with error information is generated

```text
ERROR GET /i18n/i18n_fr.properties 
\____ Error: FAILED
```

> Example of error

* When `verbose` is `true` : all request events are dumped, the request `id` is used to **correlate** the traces.
  * `INCMG` : `incoming` event, documents `method` and `url`
  * `RDRCT` : `redirecting` event, documents `type` and `redirect`
  * `SERVE` : `redirected` event, documents `statusCode` and `timeSpent`
  * `ABORT` : `aborted` event
  * `CLOSE` : `closed` event

```text
Server running at http://192.168.4.41:8080/
INCMG 0001 GET /
RDRCT 0001 file ./webapp/index.html
CLOSE 0001 
SERVE 0001 200 16 ms
INCMG 0002 GET /load-ui5.js
RDRCT 0002 file ./webapp/load-ui5.js
CLOSE 0002
SERVE 0002 200 5 ms
INCMG 0003 GET /init.js
RDRCT 0003 file ./webapp/init.js
CLOSE 0003
SERVE 0003 200 4 ms
INCMG 0004 GET /test/MockServer.js
RDRCT 0004 file ./webapp/test/MockServer.js
CLOSE 0004
SERVE 0004 200 4 ms
INCMG 0005 GET /const.js
RDRCT 0005 file ./webapp/const.js
INCMG 0006 GET /test/newItem.js
RDRCT 0006 file ./webapp/test/newItem.js
CLOSE 0005
SERVE 0005 200 5 ms
CLOSE 0006
SERVE 0006 200 5 ms
INCMG 0007 GET /manifest.json
RDRCT 0007 file ./webapp/manifest.json
CLOSE 0007 
SERVE 0007 200 3 ms
INCMG 0008 GET /model/metadata.xml
RDRCT 0008 file ./webapp/model/metadata.xml
CLOSE 0008
SERVE 0008 200 3 ms
INCMG 0009 GET /model/metadata.xml
RDRCT 0009 file ./webapp/model/metadata.xml
CLOSE 0009
SERVE 0009 200 3 ms
INCMG 000A GET /model/AppConfigurationSet.json
RDRCT 000A file ./webapp/model/AppConfigurationSet.json
CLOSE 000A
SERVE 000A 200 4 ms
INCMG 000B GET /model/TodoItemSet.json
RDRCT 000B file ./webapp/model/TodoItemSet.json
CLOSE 000B
SERVE 000B 200 3 ms
INCMG 000C GET /Component-preload.js
RDRCT 000C file ./webapp/Component-preload.js
RDRCT 000C status 404
SERVE 000C 404 3 ms
CLOSE 000C
INCMG 000D GET /Component-preload.js
RDRCT 000D file ./webapp/Component-preload.js
RDRCT 000D status 404
SERVE 000D 404 2 ms
CLOSE 000D
INCMG 000E GET /Component.js
RDRCT 000E file ./webapp/Component.js
CLOSE 000E
SERVE 000E 200 3 ms
INCMG 000F GET /manifest.json
RDRCT 000F file ./webapp/manifest.json
CLOSE 000F 
SERVE 000F 200 5 ms
INCMG 0010 GET /css/styles.css
RDRCT 0010 file ./webapp/css/styles.css
CLOSE 0010
SERVE 0010 200 4 ms
INCMG 0011 GET /i18n/i18n_fr.properties
RDRCT 0011 file ./webapp/i18n/i18n_fr.properties
RDRCT 0011 status 404
SERVE 0011 404 2 ms
CLOSE 0011
INCMG 0012 GET /i18n/i18n_en.properties
RDRCT 0012 file ./webapp/i18n/i18n_en.properties
RDRCT 0012 status 404
SERVE 0012 404 2 ms
CLOSE 0012
INCMG 0013 GET /i18n/i18n.properties
RDRCT 0013 file ./webapp/i18n/i18n.properties
CLOSE 0013
SERVE 0013 200 3 ms
INCMG 0014 GET /view/App.view.xml
RDRCT 0014 file ./webapp/view/App.view.xml
CLOSE 0014
SERVE 0014 200 3 ms
INCMG 0015 GET /controller/App.controller.js
RDRCT 0015 file ./webapp/controller/App.controller.js
CLOSE 0015
SERVE 0015 200 3 ms
```

> Example of `log(...,true)` output

In case of error, a trace with error information is generated

```text
INCMG 0011 GET /i18n/i18n_fr.properties
RDRCT 0011 file ./webapp/i18n/i18n_fr.properties
RDRCT 0011 custom ./error.js
ERROR 0011 Error: FAILED
RDRCT 0011 status 500
SERVE 0011 500 3 ms
CLOSE 0011
```

> Example of error
