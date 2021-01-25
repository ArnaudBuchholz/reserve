'use strict'

const http = require('http')
const https = require('https')

function protocol (url) {
  if (url.startsWith('https')) {
    return https
  }
  return http
}

function unsecureCookies (headers) {
  const setCookie = headers['set-cookie']
  if (setCookie) {
    headers['set-cookie'] = setCookie.map(cookie => cookie.replace(/\s*secure;/i, ''))
  }
}

function noop () {}

function validateHook (mapping, hookName) {
  if (typeof mapping[hookName] === 'string') {
    mapping[hookName] = require(mapping[hookName])
  }
}

module.exports = {
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
    }
  },
  validate: async mapping => {
    validateHook(mapping, 'forward-request')
    validateHook(mapping, 'forward-response')
  },
  redirect: async ({ configuration, mapping, match, redirect: url, request, response }) => {
    let done
    let fail
    const promise = new Promise((resolve, reject) => {
      done = resolve
      fail = reject
    })
    const { method, headers } = request
    delete headers.host // Some websites rely on the host header
    const options = {
      method,
      url,
      headers
    }
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
    const redirectedRequest = protocol(options.url).request(options.url, options, async redirectedResponse => {
      if (mapping['unsecure-cookies']) {
        unsecureCookies(redirectedResponse.headers)
      }
      const { headers: responseHeaders } = redirectedResponse
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
      response.writeHead(redirectedResponse.statusCode, responseHeaders)
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
