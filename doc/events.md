# Server events

The REserve server object implements the [EventEmitter](https://nodejs.org/api/events.html) class and throws [**events with parameters**](events.md) to **notify** any listener of **its activity**.

When a **request is being dispatched**, the following diagram illustrates the **sequence of events that are emitted**.

![Events TAM State Diagram](events_state.png)

| Event | Parameter *(object containing members)* | Description |
|---|---|---|
| **server-created** | `server` *([`http.server`](https://nodejs.org/api/http.html#http_class_http_server) or [`https.server`](https://nodejs.org/api/https.html#https_class_https_server))*, `configuration` *([configuration interface](#configuration-interface))*| Only available to `listeners`, this event is triggered after the HTTP(S) server is **created** and **before it accepts requests**.
| **ready** | `url` *(String, example : `'http://0.0.0.0:8080/'`)*, `port` *(Number, example : `8080`)*| The server is listening and ready to receive requests, hostname is replaced with `0.0.0.0` when **unspecified**. `port` was added in version 1.9.3
| **incoming** | `method` *(String, example : `'GET'`)*, `url` *(String)*, `start` *(Date)*, `id` *(Number)* | New request received, the `id` is a unique request identifier. These parameters are also transmitted to **error**, **redirecting**,**redirected**, **aborted** and **closed** events. |
| **error** | `reason` *(Any)* | Error reason, contains **incoming** parameters only if the error is related to a request. |
| **redirecting** | *same parameters as **incoming***, `type` *(Handler type, example : `'status'`)*, `redirect` *(String or Number, example : `404`)* | Processing redirection to handler, gives handler type and redirection value. <br />*For instance, when a request will be served by the [file handler](#file), this event is generated once. But if the requested resource does not exist, the request will be redirected to the [status](#status) 404 triggering again this event.* |
| **redirected** | *same parameters as **incoming***, `end` *(Date)*, `timeSpent` *(Number of ms)*, `statusCode` *(Number)* | Request is fully processed. `timeSpent` is evaluated by comparing `start` and `end` (i.e. not using high resolution timers) and provided for information only. |
| **aborted** | *same parameters as **incoming*** | Request was [aborted](https://nodejs.org/api/http.html#http_event_aborted). |
| **closed** | *same parameters as **incoming*** | Request underlying connection was [closed](https://nodejs.org/api/http.html#http_event_close_2). |
