import { Stats } from 'fs'
import { IncomingMessage, ServerResponse, Server as HttpServer } from 'http'
import { Server as HttpsServer } from 'https'
import { Http2Server } from 'http2'

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

  interface CustomFileSystemStat {
    isDirectory: () => boolean
    size: number
    mtime: Date
  }

  interface CustomFileSystem {
    readdir: (folderPath: string) => Promise<string[]>
    stat: (filePath: string) => Promise<CustomFileSystemStat>
    createReadStream: (filePath: string, options?: ReadStreamOptions) => Promise<ReadableStream>
  }

  interface PunycacheOptions {
    ttl?: number
    max?: number
    policy?: 'lru' | 'lfu'
  }

  interface FileMapping extends BaseMapping {
    file: string
    'mime-types'?: { [key: string]: string }
    'caching-strategy'?: 'modified' | number
    'custom-file-system'?: string | CustomFileSystem
    'static'?: boolean | PunycacheOptions
  }

  // endregion file

  // region status

  interface StatusMapping extends BaseMapping {
    status: number
    headers?: { [key: string]: string }
  }

  // endregion status

  // region url

  type Headers = { [key: string]: string | string[] }

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
    use: string | ((options?: object) => ((request: IncomingMessage, response: ServerResponse, next: (err: Error) => void) => void))
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
    readonly schema?: { [key: string]: string | string[] | PropertySchema }
    readonly method?: string
    readonly validate?: (mapping: BaseMapping, configuration: IConfiguration) => void
    readonly redirect: (context: RedirectContext) => Promise<RedirectResponse>
  }

  type Handlers = { [key: string]: Handler }

  type Listener = string | ServerListener

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

  enum ServerEventName {
    created = 'created',
    ready = 'ready',
    incoming = 'incoming',
    error = 'error',
    redirecting = 'redirecting',
    redirected = 'redirected',
    aborted = 'aborted',
    closed = 'closed'
  }

  type ServerEventIncoming = {
    method: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'TRACE' | 'PATCH' | string
    incomingUrl: string // before normalization
    url: string // after normalization
    headers: Headers
    start: Date
    id: number
    internal: boolean
  }

  type ServerEvent = 
  |
    {
      eventName: ServerEventName.created
      server: HttpServer | HttpsServer | Http2Server
      configuration: IConfiguration
    }
  |
    {
      eventName: ServerEventName.ready
      url: string
      port: number
      http2 : boolean
    }
  |
    {
      eventName: ServerEventName.incoming
    } & ServerEventIncoming
  |
    {
      eventName: ServerEventName.error
      error: any
    } & ServerEventIncoming
  | 
    {
      eventName: ServerEventName.redirecting
      type: string
      redirect: string | number
    } & ServerEventIncoming
  | 
    {
      eventName: ServerEventName.redirected
      end: Date
      timeSpent: number
      statusCode: number
    } & ServerEventIncoming
  | 
    {
      eventName: ServerEventName.aborted
    } & ServerEventIncoming
  | 
    {
      eventName: ServerEventName.closed
    } & ServerEventIncoming

  type ServerListener = (event: ServerEvent) => void

  interface Server {
    on (eventName: ServerEventName, listener: ServerListener)
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
