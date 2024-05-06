# Server events

The REserve server object implements an interface that mimics the [EventEmitter::on method](https://nodejs.org/api/events.html#emitteroneventname-listener) and triggers **events with parameters** to `'notify'` any listener of **its activity**.

When a **request is processed**, the following diagram illustrates the **sequence of events that are emitted**.

![Events TAM State Diagram](events_state.png)

> Diagram of events emitted by REserve while processing a request

ⓘ These events are handled by the [`log`](log.md) helper.

| Event<br>`eventName`| Parameters<br>_`...members`_ | Description |
|---|---|---|
| `'created'` | `server`: [`http.server`](https://nodejs.org/api/http.html#http_class_http_server) \| [`https.server`](https://nodejs.org/api/https.html#https_class_https_server)<br>`configuration`: [`IConfiguration`](iconfiguration.md) | Only available to `listeners`, this event is emitted **after** the HTTP(S) server is `'created'` and **before** it accepts requests.
| `'ready'` | `url`: `string`<br>`port`: `number`<br>`http2`: `boolean` | The server is listening and **ready** to receive requests.<br>`url` contains a valid address *(for instance: `'http://192.168.4.1:8080/'`)*.
| `'incoming'` | `method`: `string` *(uppercase)*<br>`incomingUrl`: `String`<br>`url`: `string`<br>`headers`: `{ [key: string]: string \| string[] }`<br>`start`: `Date`<br>`id`: `number`<br>`internal`: `boolean` | **New** request received.<br>`incomingUrl` contains the original URL *(before normalization)*.<br>`url` contains the URL to be matched.<br>`id` is a unique identifier allocated by REserve.<br>`internal` signals internally dispatched request *(see [configuration interface](iconfiguration.md#async-dispatch-request-response)*).<br><br><small>These members are also available for `'error'`, `'redirecting'`,`'redirected'`, `'aborted'` and `'closed'` events.</small>|
| `'error'` | `reason`: `any` | An error occurred. |
| `'error'` | `...'incoming'`<br>`reason`: `any` | An error occurred while processing a request. |
| `'redirecting'` | `...'incoming'`<br>`type`: `string`<br>`redirect`: `string` \| `number` | Processing redirection to handler, gives handler type and redirection value. <br />*For instance, when a request will be served by the [file handler](#file), this event is generated once. But if the requested resource does not exist, the request will be redirected to the [status](#status) 404 triggering again this event.* |

| `'redirected'` | *same parameters as `'incoming'`*`end` *(Date)*<br>`timeSpent` *(Number of ms)*<br>`statusCode` *(Number)*</li></ul> | Request is fully processed. `timeSpent` is evaluated by comparing `start` and `end` (i.e. not using high resolution timers) and provided for information only. |
| `'aborted'` | *same parameters as `'incoming'`* | Request was [aborted](https://nodejs.org/api/http.html#http_event_aborted).<small><br />Added in version 1.9.0</small> |
| `'closed'` | *same parameters as `'incoming'`* | Request underlying connection was [closed](https://nodejs.org/api/http.html#http_event_close_2). <small><br />Added in version 1.9.0</small>|
