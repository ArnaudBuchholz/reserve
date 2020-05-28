# Server events

| Event | Parameter *(object containing members)* | Description |
|---|---|---|
| **server-created** | `server` *([`http.server`](https://nodejs.org/api/http.html#http_class_http_server) or [`https.server`](https://nodejs.org/api/https.html#https_class_https_server))*, `configuration` *([configuration interface](#configuration-interface))*| Only available to `listeners`, this event is triggered after the HTTP(S) server is **created** and **before it accepts requests**.
| **ready** | `url` *(String, example : `'http://0.0.0.0:8080/'`)*| The server is listening and ready to receive requests, hostname is replaced with `0.0.0.0` when **unspecified**.
| **incoming** | `method` *(String, example : `'GET'`)*, `url` *(String)*, `start` *(Date)* | New request received, these parameters are also transmitted to **error**, **redirecting** and **redirected** events |
| **error** | `reason` *(Any)* | Error reason, contains **incoming** parameters if related to a request |
| **redirecting** | `type` *(Handler type, example : `'status'`)*, `redirect` *(String or Number, example : `404`)* | Processing redirection to handler, gives handler type and redirection value. <br />*For instance, when a request will be served by the [file handler](#file), this event is generated once. But if the requested resource does not exist, the request will be redirected to the [status](#status) 404 triggering again this event.* |
| **redirected** | `end` *(Date)*, `timeSpent` *(Number of ms)*, `statusCode` *(Number)* | Request is fully processed. `timeSpent` is evaluated by comparing `start` and `end` (i.e. not using high resolution timers) and provided for information only. |
