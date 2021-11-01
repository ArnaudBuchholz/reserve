import { EventEmitter } from 'events'
import { Stats } from 'fs'
import { IncomingMessage, ServerResponse } from 'http'

declare module 'reserve' {
  type RedirectResponse = undefined | number | string

  type IfMatcher = (request: IncomingMessage, url: string, match: RegExpMatchArray) => boolean | RedirectResponse

  interface BaseMapping {
    match?: string | RegExp
    method?: string
    'invert-match'?: boolean
    'if-match'?: IfMatcher
    'exclude-from-holding-list'?: boolean
    cwd: string
  }

  // region file

  interface ReadStreamOptions {
    start: number
    end: number
  }

  interface CustomFileSystem {
    readdir?: (folderPath: string) => Promise<string[]>
    stat: (filePath: string) => Promise<Stats>
    createReadStream: (filePath: string, options?: ReadStreamOptions) => Promise<ReadableStream>
  }

  interface FileMapping extends BaseMapping {
    file: string
    'case-sensitive'?: boolean
    'ignore-if-not-found'?: boolean
    'custom-file-system'?: string | CustomFileSystem
    'caching-strategy'?: 'modified' | number
    'strict'?: boolean
    'mime-types'?: Record<string, string>
  }

  // endregion file

  // region url

  type Headers = Record<string, string>

  interface RequestSummary {
    method: string
    url: string
    headers: Headers
  }

  interface ForwardRequestContext {
    configuration: IConfiguration
    context: object
    mapping: BaseUrlMapping
    match: RegExpMatchArray
    request: RequestSummary
    incoming: IncomingMessage
  }

  interface ForwardResponseContext {
    configuration: IConfiguration
    context: object
    mapping: BaseUrlMapping
    match: RegExpMatchArray
    request: RequestSummary
    statusCode: number
    headers: Headers
  }

  interface UrlMapping extends BaseMapping {
    url: string
    'unsecure-cookies'?: boolean
    'forward-request'?: string | ((context: ForwardRequestContext) => Promise<void>)
    'forward-response'?: string | ((context: ForwardResponseContext) => Promise<RedirectResponse>)
    'ignore-unverifiable-certificate'?: boolean
    'absolute-location'?: boolean
  }

  // endregion url

  // region custom

  interface CustomMapping extends BaseMapping {
    custom: string | ((request: IncomingMessage, response: ServerResponse, ...capturedGroups: string[]) => Promise<RedirectResponse>)
    watch?: boolean
  }

  // endregion custom

  // region use

  interface UseMapping extends BaseMapping {
    use: object
  }

  // endregion use

  interface SSLSettings {
    cert: string
    key: string
  }

  interface PropertySchema {
    type?: string
    types?: string[]
    defaultValue?: boolean | number | string | object | function
  }

  interface RedirectContext {
    configuration: IConfiguration
    mapping: BaseMapping
    match: RegExpMatchArray
    redirect: string
    request: IncomingMessage
    response: ServerResponse
  }

  interface Handler {
    schema?: Record<string, string | string[] | PropertySchema>
    method?: string
    validate?: (mapping: BaseMapping, configuration: IConfiguration) => void
    redirect: (context: RedirectContext) => Promise<RedirectResponse>
  }

  type Handlers = Record<string, Handler>

  type Listener = string | ((eventEmitter: EventEmitter) => void)

  type Mapping = BaseMapping | FileMapping | UrlMapping | CustomMapping

  interface Configuration {
    hostname?: string
    port?: number
    'max-redirect'?: number
    ssl?: SSLSettings
    http2?: boolean
    httpOptions?: object
    handlers?: Handlers
    listeners?: Listener[]
    mappings: Mapping[]
    extend?: string
  }

  interface IConfiguration {
    readonly handlers: Handlers
    readonly mappings: Mapping[]
    readonly http2: boolean
    readonly protocol: string
    setMappings: (mappings: Mapping[], request: IncomingMessage, timeout?: number) => Promise<void>
    dispatch: (request: IncomingMessage, response: ServerResponse) => void
  }

  function check (configuration: Configuration): Promise<Configuration>
  function log (server: EventEmitter, verbose?: boolean): EventEmitter
  function serve (configuration: Configuration): EventEmitter
  function mock (configuration: Configuration, mockedHandlers?: Handlers): Promise<EventEmitter>
}
