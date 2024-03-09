import { Configuration, mock } from 'reserve'
import { IncomingMessage, ServerResponse } from 'http'

export const configurations: Configuration[] = [{
  port: 8080,
  mappings: [{
    match: /.*/,
    file: '$1'
  }, {
    use: 'package'
  }, {
    use: (options?: object) => (request: IncomingMessage, response: ServerResponse, next: (err: Error) => void): void => {},
    options: {
      opt1: 1,
      optA: 'A'
    }
  }, {
    use: () => (request: IncomingMessage, response: ServerResponse): void => {}
  }, {
    use: () => (request: IncomingMessage): void => {}
  }, {
    custom: async (request: IncomingMessage, response: ServerResponse): Promise<void> => {}
  }]
}]

export async function main() {
  const mockServer = await mock({
    mappings: [{
      match: /.*/,
      file: '$1'
    }]
  });

  mockServer.request('GET', '/hello');
  mockServer.request('GET', '/hello', {
    'x-server': 'reserve'
  });
  mockServer.request('PUT', '/hello', {
    'content-type': 'application/json'
  }, JSON.stringify({
    hello: 'World'
  }));
}