import { EventEmitter } from 'events'
import { Stats } from 'fs'
import { IncomingMessage, ServerResponse, Server as HttpServer } from 'http'
import { Server as HttpsServer } from 'https'
import { Server as Http2Server } from 'http2'

declare module 'reserve' {
  type RedirectResponse = void | number | string

  class Request extends IncomingMessage {
    setForgedUrl: (url: string) => void
  }

  class Response extends ServerResponse {
    constructor(req?: Request)
    waitForFinish: () => Promise<void>
    isInitial: () => boolean
    setAsynchronous: () => void
  }

  type IfMatcher = (request: IncomingMessage, url: string, match: RegExpMatchArray) => boolean | RedirectResponse

  interface BaseMapping {
    match?: string | RegExp
    method?: string
    'invert-match'?: boolean
    'if-match'?: IfMatcher
    'exclude-from-holding-list'?: boolean
    cwd?: string
  }

  // region custom

  interface CustomMapping extends BaseMapping {
    custom: string | ((request: IncomingMessage, response: ServerResponse, ...capturedGroups: string[]) => Promise<RedirectResponse>)
    watch?: boolean
  }

  // endregion custom

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
    'http-status'?: number
  }

  // endregion file

  // region status

  interface StatusMapping extends BaseMapping {
    status: number
    headers?: Record<string, string>
  }

  // endregion status

  // region url

  type Headers = Record<string, string | string[]>

  interface RequestSummary {
    method: string
    url: string
    headers: Headers
  }

  interface ForwardRequestContext {
    configuration: IConfiguration
    context: object
    mapping: UrlMapping
    match: RegExpMatchArray
    request: RequestSummary
    incoming: IncomingMessage
  }

  interface ForwardResponseContext {
    configuration: IConfiguration
    context: object
    mapping: UrlMapping
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

  // region use

  interface UseMapping extends BaseMapping {
    use: string | ((request: IncomingMessage, response: ServerResponse, next: (err: Error) => void) => void)
    options?: object
  }

  // endregion use

  interface SSLSettings {
    cert: string
    key: string
  }

  interface PropertySchema {
    type?: string
    types?: string[]
    defaultValue?: boolean | number | string | object | Function
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

  type Mapping = BaseMapping | CustomMapping | FileMapping | StatusMapping | UrlMapping | UseMapping

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

  interface BodyOptions {
    ignoreContentLength?: boolean
  }

  type BodyResult = Promise<Buffer | string | object> & {
    buffer: () => Promise<Buffer>
    text: () => Promise<string>
    json: () => Promise<object>
  }

  function body (request: IncomingMessage, options?: BodyOptions): BodyResult

  function capture (response: ServerResponse, stream: WritableStream): Promise<void>

  interface SendOptions {
    statusCode?: number /* defaulted to 200 */
    headers?: Headers
    noBody?: boolean /* do not send body */
  }

  function send (response: ServerResponse, data: ReadableStream, options?: SendOptions): Promise<void>
  function send (response: ServerResponse, data?: string | object, options?: SendOptions): void

  function check (configuration: Configuration): Promise<Configuration>

  enum ServerEvent {
    serverCreated = 'server-created',
    ready = 'ready',
    incoming = 'incoming',
    error = 'error',
    redirecting = 'redirecting',
    redirected = 'redirected',
    aborted = 'aborted',
    closed = 'closed'
  }

  type ServerEventIncomingParameter = {
    method: string
    url: string
    headers: Headers
    start: Date
    perfDate: number
    id: number
    internal: boolean
  }

  type ServerEventParameter = 
  |
    {
      event: ServerEvent.serverCreated
      server: HttpServer | HttpsServer | Http2Server
      configuration: IConfiguration
    }
  |
    {
      event: ServerEvent.ready
      url: string
      port: number
      http2 : boolean
    }
  |
    {
      event: ServerEvent.incoming
    } & ServerEventIncomingParameter
  |
    {
      event: ServerEvent.incoming
      error: any
    } & ServerEventIncomingParameter
  | 
    {
      event: ServerEvent.redirecting
      type: string
      redirect: string | number
    } & ServerEventIncomingParameter
  | 
    {
      event: ServerEvent.redirected
      end: Date
      perfEnd: number
      timeSpent: number
      statusCode: number
    } & ServerEventIncomingParameter
  | 
    {
      event: ServerEvent.aborted
    } & ServerEventIncomingParameter
  | 
    {
      event: ServerEvent.closed
    } & ServerEventIncomingParameter
  }

  interface Server {
    on (event: ServerEvent, listener: (parameter: ServerEventParameter) => void)
    close: () => Promise<void>
  }

  function log (server: Server, verbose?: boolean): Server
  function serve (configuration: Configuration): Server

  interface MockedResponse extends ServerResponse {
    toString: () => string
    waitForFinish: () => Promise<void>
    isInitial: () => boolean
    setAsynchronous: () => void
  }

  type MockedRequestDefinition = {
    method?: string,
    url: string,
    headers?: Headers,
    body?: string,
    properties?: object
  }

  interface MockServer extends Server {
    request: ((method: string, url: string) => Promise<MockedResponse>) &
      ((method: string, url: string, headers: Headers) => Promise<MockedResponse>) &
      ((method: string, url: string, headers: Headers, body: string) => Promise<MockedResponse>) &
      ((method: string, url: string, headers: Headers, body: string, properties: object) => Promise<MockedResponse>) &
      ((definition: MockedRequestDefinition) => Promise<MockedResponse>)
  }

  function mock (configuration: Configuration, mockedHandlers?: Handlers): Promise<MockServer>
}

