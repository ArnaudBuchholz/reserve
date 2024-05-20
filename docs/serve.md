# `serve` export

[🔝 REserve documentation](README.md)

REserve's main entry point is `serve`.

```typescript
interface Server {
  on (eventName: ServerEventName, listener: ServerListener)
  close: () => Promise<void>
}

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
