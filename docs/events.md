# Server events

The REserve server object implements an interface that mimics the [EventEmitter::on method](https://nodejs.org/api/events.html#emitteroneventname-listener) and triggers **events with parameters** to `'notify'` any listener of **its activity**.

When a **request is processed**, the following diagram illustrates the **sequence of events that are emitted**.

![Events TAM State Diagram](events_state.png)

> Diagram of events emitted by REserve while processing a request

ⓘ These events are handled by the [`log`](log.md) helper.

| Event<br>`eventName`| Parameters<br>_`...members`_ | Description |
|---|---|---|
| `'created'` | `server`: [`http.server`](https://nodejs.org/api/http.html#http_class_http_server) \| [`https.server`](https://nodejs.org/api/https.html#https_class_https_server)<br>`configuration`: [`IConfiguration`](iconfiguration.md) | Only available to `listeners`, this event is emitted **after** the HTTP(S) server is `'created'` and **before** it accepts requests.
| `'ready'` | `url`: `string`<br>`port`: `number`<br>`http2`: `boolean` | The server is listening and **ready** to receive requests.<br>`url` contains a valid address *(for instance: `'http://192.168.4.1:8080/'`)*.
| `'incoming'` | `method`: `string` *(uppercase)*<br>`incomingUrl`: `String`<br>`url`: `string`<br>`headers`: `{ [key: string]: string \| string[] }`<br>`start`: `Date`<br>`id`: `number`<br>`internal`: `boolean` | **New** request received.<br>`incomingUrl` contains the original URL *(before normalization)*.<br>`url` contains the URL to be matched.<br>`id` is a unique identifier allocated by REserve.<br>`internal` signals internally dispatched request *(see [configuration interface](iconfiguration.md#async-dispatch-request-response)*).<br><br><small>These members are also available for `'error'`, `'redirecting'`,`'redirected'`, `'aborted'` and `'closed'` events.</small>|
| `'error'` | `reason`: `any` | An **error** occurred. |
| `'error'` | `...'incoming'`<br>`reason`: `any` | An **error** occurred while **processing** a request. |
| `'redirecting'` | `...'incoming'`<br>`type`: `string`<br>`redirect`: `string` \| `number` | Request will be **processed** by a handler.<br>`type` contains the handler prefix.<br>`redirect` contains the redirection value. |
| `'redirected'` | `...'incoming'`<br>`end`: `Date`<br>`timeSpent`: `number` *(ms)*<br>`statusCode`: `number` | Request is **fully** processed.<br>`timeSpent` is evaluated by comparing `start` and `end` *(not a high resolution timer)*. |
| `'aborted'` | `...'incoming'` | Request was **[aborted](https://nodejs.org/api/http.html#http_event_aborted)**. |
| `'closed'` | `...'incoming'` | Request was **[closed](https://nodejs.org/api/http.html#http_event_close_2)**. |
