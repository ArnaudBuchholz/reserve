import { Configuration } from 'reserve'
import { IncomingMessage, ServerResponse } from 'http'

export const configurations: Configuration[] = [{
  port: 8080,
  mappings: [{
    match: /.*/,
    file: '$1'
  }, {
    use: 'package'
  }, {
    use: (request: IncomingMessage, response: ServerResponse, next: (err: Error) => void): void => {},
    options: {
      opt1: 1,
      optA: 'A'
    }
  }, {
    use: (request: IncomingMessage, response: ServerResponse): void => {}
  }, {
    use: (request: IncomingMessage): void => {}
  }, {
    custom: async (request: IncomingMessage, response: ServerResponse): Promise<void> => {}
  }]
}]
