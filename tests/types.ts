import { Configuration } from 'reserve'
import { IncomingMessage, ServerResponse } from 'http'

function check<T extends any> (value: T): boolean {
  return typeof value === 'object'
}

check<Configuration>({
  port: 8080,
  mappings: [{
    match: /.*/,
    file: '$1'
  }, {
    custom: async (request: IncomingMessage, response: ServerResponse): Promise<void> => {}
  }]
})

