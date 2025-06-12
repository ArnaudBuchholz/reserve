# `serve` export

[🔝 REserve documentation](README.md)

REserve's main entry point is `serve`.

```typescript
type ServerCloseOptions = {
  /** If set, waits up to the timeout (ms) for the active requests to terminate */
  timeout?: number
  /** If set, terminate the active requests (after the timeout if specified) */
  force?: true
}

interface Server {
  /** Register listener for the given event */
  on: <EventName extends ServerEventName>(eventName: EventName, listener: ServerListener<EventName>) => Server
  /** Terminate the server */
  close: (options?: ServerCloseOptions) => Promise<void>
}

/** Validate configuration, allocate a server and start listening */
function serve (configuration: Configuration): Server
```

> Types definition for `serve`

The configuration must comply with the properties and mappings [documented here](configuration.md).

The server object implements an interface that mimics the [EventEmitter::on method](https://nodejs.org/api/events.html#emitteroneventname-listener) and, during execution, it triggers [**events with parameters**](events.md) to **notify** any listener of **its activity**.

```
import { serve } from 'reserve'

const server = serve({
  "port": 8080,
  "mappings": [{
    "match": "^/private/",
    "status": 403
  }, {
    "match": "^/(.*)",
    "file": "./$1"
  }, {
    "status": 404
  }]
})

server.on('ready', ({ url }) => console.log(`Server running at ${url}`))
```

> Example of a server using the `serve` function
