import { Configuration } from 'reserve'
import { IncomingMessage, ServerResponse } from 'http'

export const configurations: Configuration[] = [{
  port: 8080,
  mappings: [{
    match: /.*/,
    file: '$1'
  }, {
    custom: async (request: IncomingMessage, response: ServerResponse): Promise<void> => {}
  }]
}]
