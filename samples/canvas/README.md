# server-sent events

This sample demonstrates the use of [server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) through the native [EventSource class](https://developer.mozilla.org/en-US/docs/Web/API/EventSource).

## How to start

`node ../..`

## How to use

Open one of the links below and then start drag & dropping in the opened page...

* Standalone window : http://localhost:8082/draw.html
* 4 windows : http://localhost:8082/display.html?count=4&header=100
* 6 windows : http://localhost:8082/display.html?count=6&header=100

When using 6 windows, you reach the [limit of opened connections for the browser](https://docs.pushtechnology.com/cloud/latest/manual/html/designguide/solution/support/connection_limitations.html#:~:text=Browsers%20limit%20the%20number%20of,allow%20six%20connections%20per%20domain.). Hence, the plots are no more pushed to the backend until you close one window.

With the help of [storage events](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event), it is possible to build a solution that goes beyond this limit.

* 6 windows : http://localhost:8082/display.html?count=6&header=100&mode=shared
* 9 windows : http://localhost:8082/display.html?count=9&header=100&mode=shared
* 16 windows : http://localhost:8082/display.html?count=16&header=100&mode=shared

Another solution is to go with a [service worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API), meaning one central thread that listens to the events and dispatch them to the opened windows

* 6 windows : http://localhost:8082/display.html?count=6&header=100&mode=worker
* 9 windows : http://localhost:8082/display.html?count=9&header=100&mode=worker
* 16 windows : http://localhost:8082/display.html?count=16&header=100&mode=worker

## HTTP/2

The same examples can also be played on HTTP/2, it basically removes the maximum number of connections

`node ../.. --config http2.json`

* Standalone window : https://localhost:8082/draw.html
* 4 windows : https://localhost:8082/display.html?count=4&header=100
* 6 windows : https://localhost:8082/display.html?count=6&header=100
* 9 windows : https://localhost:8082/display.html?count=9&header=100
