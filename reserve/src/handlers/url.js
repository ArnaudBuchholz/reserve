'use strict'

const { http, https } = require('../node-api')
const headersFactory = require('../mock/headers')
const defer = require('../defer')
const { $handlerPrefix } = require('../symbols')
const smartImport = require('../smartImport')

const http2ForbiddenResponseHeaders = [
  'transfer-encoding',
  'connection',
  'keep-alive'
]

function protocol (url) {
  if (url.startsWith('https')) {
    return https
  }
  return http
}

function unsecureCookies (headers) {
  const setCookie = headers['set-cookie']
  if (setCookie) {
    headers['set-cookie'] = setCookie.map(cookie => {
      const modified = cookie.replace(/\s*secure;?/i, '')
      if (modified !== cookie) {
        return modified.replace(/\s*samesite=none;?/i, ' SameSite=Lax;')
      }
      return cookie
    })
  }
}

function noop () {}

async function validateHook (mapping, hookName) {
  if (typeof mapping[hookName] === 'string') {
    mapping[hookName] = await smartImport(mapping[hookName])
  }
}

module.exports = {
  [$handlerPrefix]: 'url',
  schema: {
    'unsecure-cookies': {
      type: 'boolean',
      defaultValue: false
    },
    'forward-request': {
      types: ['function', 'string'],
      defaultValue: noop
    },
    'forward-response': {
      types: ['function', 'string'],
      defaultValue: noop
    },
    'ignore-unverifiable-certificate': {
      type: 'boolean',
      defaultValue: false
    },
    'absolute-location': {
      type: 'boolean',
      defaultValue: false
    }
  },
  validate: async mapping => {
    await validateHook(mapping, 'forward-request')
    await validateHook(mapping, 'forward-response')
  },
  redirect: async ({ configuration, mapping, match, redirect: url, request, response }) => {
    const [promise, done, fail] = defer()
    const { method, headers } = request
    const options = {
      method,
      url,
      headers: headersFactory(headers)
    }
    delete options.headers.host // Some websites rely on the host header
    if (mapping['ignore-unverifiable-certificate']) {
      options.rejectUnauthorized = false
    }
    const context = {}
    const hookParams = {
      configuration,
      context,
      mapping,
      match,
      request: options,
      incoming: request
    }
    await mapping['forward-request'](hookParams)
    Object.keys(options.headers)
      .filter(header => header.startsWith(':'))
      .forEach(header => delete options.headers[header])
    const redirectedRequest = protocol(options.url).request(options.url, options, async redirectedResponse => {
      if (mapping['unsecure-cookies']) {
        unsecureCookies(redirectedResponse.headers)
      }
      const { headers: responseHeaders } = redirectedResponse
      const { location } = responseHeaders
      if (location && mapping['absolute-location'] && !location.match(/^https?:\/\//)) {
        responseHeaders.location = options.url.match(/^http?s:\/\/[^/]+/)[0] + location
      }
      const result = await mapping['forward-response']({
        ...hookParams,
        statusCode: redirectedResponse.statusCode,
        headers: responseHeaders
      })
      if (result !== undefined) {
        if (!['GET', 'HEAD'].includes(request.method)) {
          return fail(new Error('Internal redirection impossible because the body is already consumed'))
        }
        return done(result)
      }
      if (configuration.http2) {
        http2ForbiddenResponseHeaders.forEach(header => delete responseHeaders[header])
      }
      response.writeHead(redirectedResponse.statusCode, responseHeaders)
      if (request.aborted) {
        response.end()
        return done()
      }
      response.on('finish', () => done(result))
      redirectedResponse
        .on('error', fail)
        .pipe(response)
    })
    redirectedRequest.on('error', fail)
    request
      .on('error', fail)
      .pipe(redirectedRequest)
    return promise
  }
}
