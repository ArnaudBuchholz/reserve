import { IncomingMessage, ServerResponse, Server as HttpServer } from 'http'
import { Server as HttpsServer } from 'https'
import { Http2Server } from 'http2'

declare module 'reserve' {
  class Request extends IncomingMessage {
    /** Sets a forged (unverified) URL for the request */
    setForgedUrl: (url: string) => void
  }

  type RedirectResponse = 
    | void
    /** Ends the response with corresponding status code */
    | number
    /** Triggers an internal redirect */
    | string

  type IfMatcher = (request: IncomingMessage, url: string, match: RegExpMatchArray) => boolean | RedirectResponse

  interface BaseMapping {
    /** URL matching, capturing groups are allowed */
    match?: string | RegExp
    /** Request method matching */
    method?: string
    /** Inverts the matching process when set to true, enabling the implementation of an 'all but' pattern */
    'invert-match'?: boolean
    /** Executed only if the mapping matches the request, enabling finer control */
    'if-match'?: IfMatcher
    /** Ignore any request processed by this mapping when updating the list of mappings */
    'exclude-from-holding-list'?: boolean
    /** Current working folder */
    cwd?: string
  }

  type ExternalModule = string

  // region custom

  type CustomRedirectResponse = 
    | RedirectResponse
    /** Handles response through send */
    | [ ReadableStream | string | object ]
    /** Handles response through send */
    | [ ReadableStream | string | object, SendOptions ]

  interface CustomMapping extends BaseMapping {
    custom: 
      | ExternalModule
      | [string]
      | [object]
      | [string, SendOptions]
      | [object, SendOptions]
      | ((request: IncomingMessage, response: ServerResponse, ...capturedGroups: string[]) => CustomRedirectResponse | Promise<CustomRedirectResponse>)
  }

  // endregion custom

  // region file

  interface ReadStreamOptions {
    /** Start position in the file */
    start: number
    /** End position in the file, inclusive */
    end: number
  }

  interface CustomFileSystemStat {
    /** Returns true if the path is a directory */
    isDirectory: () => boolean
    /** Returns file size */
    size: number
    /** Returns file modification time */
    mtime: Date
  }

  interface CustomFileSystem {
    /** Reads directory content */
    readdir: (folderPath: string) => Promise<string[]>
    /** Gets path stat */
    stat: (filePath: string) => Promise<CustomFileSystemStat>
    createReadStream: (filePath: string, options?: ReadStreamOptions) => Promise<ReadableStream>
  }

  interface PunycacheOptions {
    /** Time to live in the cache, expressed in milliseconds (default: Number.POSITIVE_INFINITY) */
    ttl?: number
    /** Maximum number of keys to be stored in the cache (default: Number.POSITIVE_INFINITY) */
    max?: number
    /** Cache replacement policy (default: lru) */
    policy?:
      /** Least Recently Used (each get / set updates used timestamp) */
      | 'lru'
      /** Least Frequently Used (each get / set increments usage frequency) */
      | 'lfu'
  }

  interface FileMapping extends BaseMapping {
    /** Path to the file to be served (may contain capturing groups placeholders such as $1) */
    file: string
    /** Dictionary indexed by file extension that overrides mime type resolution */
    'mime-types'?: { [key: string]: string }
    /** Configures caching strategy, see documentation */
    'caching-strategy'?: 'modified' | number
    /** Custom file system implementation */
    'custom-file-system'?: ExternalModule | CustomFileSystem
    /** Cache file system information for performance (disabled by default) */
    'static'?: boolean | PunycacheOptions
  }

  // endregion file

  type Headers = { [key in string]?: string | string[]}

  // region status

  interface StatusMapping extends BaseMapping {
    /** HTTP status code for the response */
    status: number
    /** Additional headers */
    headers?: Headers
  }

  // endregion status

  /** REserve configuration information */
  interface IConfiguration {
    /** Dictionary of handlers indexed by their prefix */
    readonly handlers: { [key in string]?: Handler }
    /** List of active mappings */
    readonly mappings: Mapping[]
    readonly protocol: 'http' | 'https'
    /** HTTP/2 is enabled */
    readonly http2: boolean
    /** Validate and update the list of active mappings */
    setMappings: (mappings: Mapping[], request: IncomingMessage, timeout?: number) => Promise<void>
    /** Dispatch a request internally */
    dispatch: (request: IncomingMessage, response: ServerResponse) => Promise<void>
  }

  // region url

  interface RequestSummary {
    /** Request method */
    method: string
    /** Request URL */
    url: string
    /** Request headers */
    headers: Headers
  }

  interface ForwardRequestContext {
    /** REserve configuration information */
    configuration: IConfiguration
    /** Placeholder allocated to transmit additional information to the response */
    context: object
    /** Mapping being executed */
    mapping: UrlMapping
    /** Current mapping's regular expression match */
    match: RegExpMatchArray
    /** Request description (may be changed) */
    request: RequestSummary
    /** Incoming request object */
    incoming: IncomingMessage
  }

  interface ForwardResponseContext {
    /** REserve configuration information */
    configuration: IConfiguration
    /** Placeholder allocated to transmit additional information to the response */
    context: object
    /** Mapping being executed */
    mapping: UrlMapping
    /** Current mapping's regular expression match */
    match: RegExpMatchArray
    /** Request description */
    request: RequestSummary
    /** Response status code */
    statusCode: number
    /** Response headers */
    headers: Headers
  }

  interface UrlMapping extends BaseMapping {
    /** URL to redirect to (may contain capturing groups placeholders such as $1) */
    url: string
    /** Convert secure cookies to unsecure one (useful when switching between http and https) */
    'unsecure-cookies'?: boolean
    /** Hook before forwarding the request */
    'forward-request'?: ExternalModule | ((context: ForwardRequestContext) => Promise<void>)
    /** Hook before forwarding the response */
    'forward-response'?: ExternalModule | ((context: ForwardResponseContext) => Promise<RedirectResponse>)
    /** Ignore unverifiable SSL certificates */
    'ignore-unverifiable-certificate'?: boolean
    /** Converts 'location' header from relative to absolute */
    'absolute-location'?: boolean
  }

  // endregion url

  // region use

  interface UseMapping extends BaseMapping {
    use: ExternalModule | ((options?: object) => ((request: IncomingMessage, response: ServerResponse, next: (err: Error) => void) => void))
    options?: object
  }

  // endregion use

  // region helpers

  /** Listen to server events and log them */
  function log (server: Server, verbose?: boolean): Server

  /** Interpolation helper */
  function interpolate (match: RegExpMatchArray, pattern: string): string
  function interpolate (match: RegExpMatchArray, pattern: object): object

  interface BodyOptions {
    /** Ignores response's Content-Length header */
    ignoreContentLength?: boolean
  }

  type BodyResult = Promise<Buffer | string | object> & {
    /** Returns the body as a Buffer */
    buffer: () => Promise<Buffer>
    /** Returns the body as a string */
    text: () => Promise<string>
    /** Returns the body as a parsed JSON */
    json: () => Promise<any>
  }

  /** Body deserialization helper */
  function body (request: IncomingMessage, options?: BodyOptions): BodyResult

  interface SendOptions {
    /** Status code (defaulted to 200) */
    statusCode?: number
    /** Header (might override 'content-type' and 'content-length') */
    headers?: Headers
    /** Do not send body (only headers) */
    noBody?: boolean
  }

  /** Response sending helper */
  function send (response: ServerResponse, data: ReadableStream, options?: SendOptions): Promise<void>
  function send (response: ServerResponse, data?: string | object, options?: SendOptions): void

  /** Response capturing helper (check documentation) */
  function capture (response: ServerResponse, stream: WritableStream): Promise<void>

  interface PunycacheCache {
    /** Sets the value in the cache */
    set (key: string, value: any): void
    /** Gets a value from the cache */
    get (key: string): any
    /** Deletes a value from the cache */
    del (key: string): void
    /** Returns the list of keys in the cache */
    keys (): string[]
  }

  /** Cache factory */
  function punycache (options?: PunycacheOptions): PunycacheCache

  // endregion helpers

  interface SSLSettings {
    /** a relative or absolute path to the certificate file */
    cert: string
    /** a relative or absolute path to the key file */
    key: string
  }

  type JavaScriptType = 'boolean' | 'number' | 'string' | 'object' | 'function';

  interface PropertySchema {
    type?: JavaScriptType
    types?: JavaScriptType[]
    defaultValue?: boolean | number | string | object | Function
  }

  interface RedirectContext {
    /** REserve configuration information */
    configuration: IConfiguration
    /** Mapping being executed */
    mapping: BaseMapping
    /** Current mapping's regular expression match */
    match: RegExpMatchArray
    /** URL to process (placeholders are substitued) */
    redirect: string
    /** Current request */
    request: IncomingMessage
    /** Current response */
    response: ServerResponse
  }

  interface Handler {
    /** Handler schema, used to validate properties */
    readonly schema?: { [key: string]: string | string[] | PropertySchema }
    /** When specified, restricts which methods it applies to */
    readonly method?: string
    /** Validation function */
    readonly validate?: (mapping: BaseMapping, configuration: IConfiguration) => void
    /** Handler's implementation */
    readonly redirect: (context: RedirectContext) => Promise<RedirectResponse>
  }

  type Handlers = { [key in string]?: Handler }

  type Listener = ExternalModule | ServerListener

  type Mapping = BaseMapping | CustomMapping | FileMapping | StatusMapping | UrlMapping | UseMapping

  interface Configuration {
    /** Used to set the host parameter when calling http(s) server's listen */
    hostname?: string
    /** Used to set the port parameter when calling http(s) server's listen, use 0 to automatically allocates a free port */
    port?: number
    /** Limits the number of internal redirections (defaulted to 10) */
    'max-redirect'?: number
    /** Certificate information when building an https server */
    ssl?: SSLSettings
    /** Allocates an HTTP/2 server when set to true */
    http2?: boolean
    /** Additional server creation options (not validated) being passed to the appropriate native API */
    httpOptions?: object
    /** Mapping associating a handler prefix to a handler definition */
    handlers?: Handlers
    /** List of handlers to be executed upon server creation (see created event) */
    listeners?: Listener[]
    /** List of mappings to be used by the server */
    mappings: Mapping[]
  }

  /** Reads and validate JSON configuration file */
  function read (filename: string): Promise<Configuration>

  /** Validate configuration */
  function check (configuration: Configuration): Promise<Configuration>

  type ServerEventName =
    /** Emitted after the HTTP(S) server is created and before it accepts requests */
    | 'created'
    /** The server is listening and ready to receive requests */
    | 'ready'
    /** New request received */
    | 'incoming'
    /** An error occurred */
    | 'error'
    /** Request will be processed by a handler */
    | 'redirecting'
    /** Request is fully processed */
    | 'redirected'
    /** Request was aborted */
    | 'aborted'
    /** Request was closed */
    | 'closed'
  
  type ServerEventCommon = {
    method: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'TRACE' | 'PATCH' | string
    /** Before URL normalization */
    incomingUrl: string
    /** After URL normalization */
    url: string
    /** Request headers */
    headers: Headers
    /** When the request was received by REserve */
    start: Date
    /** Request unique ID (this ID is internal to REserve) */
    id: number
    /** Internal request (generated with IConfiguration.dispatch) */
    internal: boolean
  }

  type ServerEventCreated = {
    eventName: 'created'
    server: HttpServer | HttpsServer | Http2Server
    configuration: IConfiguration
  };

  type ServerEventReady = {
    eventName: 'ready'
    /** URL to connect to the server */
    url: string
    /** Configured or allocated port */
    port: number
    /** HTTP/2 is enabled */
    http2 : boolean
  }

  type ServerEventIncoming = {
    eventName: 'incoming'
  } & ServerEventCommon

  type ServerEventError = {
    eventName: 'error'
    error: any
  } & ServerEventCommon

  type ServerEventRedirecting = {
    eventName: 'redirecting'
    /** Handler prefix */
    type: string
    /** Redirection value */
    redirect: string | number
  } & ServerEventCommon

  type ServerEventRedirected = {
    eventName: 'redirected'
    /** When the request was fully processed */
    end: Date
    /** Comparison of end - start (not a high resolution timer) */
    timeSpent: number
    /** Response status code */
    statusCode: number
  } & ServerEventCommon

  type ServerEventAborted = {
    eventName: 'aborted'
  } & ServerEventCommon

  type ServerEventClosed = {
    eventName: 'closed'
  } & ServerEventCommon

  type ServerEvent<eventName = unknown> = eventName extends 'created'
    ? ServerEventCreated
    : eventName extends 'ready'
      ? ServerEventReady
      : eventName extends 'incoming'
        ? ServerEventIncoming
        : eventName extends 'error'
          ? ServerEventError
          : eventName extends 'redirecting'
            ? ServerEventRedirecting
            : eventName extends 'redirected'
              ? ServerEventRedirected
              : eventName extends 'aborted'
                ? ServerEventAborted
                : eventName extends 'closed'
                  ? ServerEventClosed
                  : ServerEventCreated | ServerEventReady | ServerEventIncoming | ServerEventError | ServerEventRedirecting | ServerEventRedirected | ServerEventAborted | ServerEventClosed

  type ServerListener<EventName = ServerEventName> = (event: ServerEvent<EventName>) => void

  type ServerCloseOptions = {
    timeout?: number // in milliseconds, default is 5000
    force?: boolean // if true, closes immediately without waiting for ongoing requests to finish
  }

  interface Server {
    /** Register listener for the given event */
    on: <EventName extends ServerEventName>(eventName: EventName, listener: ServerListener<EventName>) => Server

    close: () => Promise<void>
  }

  /** Validate configuration, allocate a server and start listening */
  function serve (configuration: Configuration): Server

  class MockedResponse extends ServerResponse {
    constructor(request?: Request)
    /** Waits for the response to be completed */
    waitForFinish: () => Promise<void>
    /** Checks if the response is still in the initial state */
    isInitial: () => boolean
    /** Sets the response' writes asynchronous */
    setAsynchronous: () => void
  }

  type MockedRequestDefinition = {
    /** Request method (defaulted to 'GET') */
    method?: string,
    /** Request URL */
    url: string,
    /** Request headers */
    headers?: Headers,
    /** Request body */
    body?: string,
    /** Additional properties (directly set on the request instance) */
    properties?: object
  }

  interface MockServer extends Server {
    /** Simulate request and generates a response */
    request: ((method: string, url: string) => Promise<MockedResponse>) &
      ((method: string, url: string, headers: Headers) => Promise<MockedResponse>) &
      ((method: string, url: string, headers: Headers, body: string) => Promise<MockedResponse>) &
      ((method: string, url: string, headers: Headers, body: string, properties: object) => Promise<MockedResponse>) &
      ((definition: MockedRequestDefinition) => Promise<MockedResponse>)
  }

  /** Validate configuration, simulate a server */
  function mock (configuration: Configuration, mockedHandlers?: Handlers): MockServer
}
