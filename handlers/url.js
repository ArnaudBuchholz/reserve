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
  ['Set-Cookie', 'set-cookie'].forEach(name => {
    if (headers[name]) {
      headers[name] = headers[name].map(cookie => cookie.replace(/\s*secure;/i, ''))
    }
  })
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
    'before-forward': {
      types: ['function', 'string'],
      defaultValue: noop
    },
    'after-forward': {
      types: ['function', 'string'],
      defaultValue: noop
    }
  },
  validate: async mapping => {
    validateHook(mapping, 'before-forward')
    validateHook(mapping, 'after-forward')
  },
  redirect: async ({ mapping, redirect: url, request, response }) => {
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
    await mapping['before-forward']({ request: options })
    const redirectedRequest = protocol(options.url).request(options.url, options, async redirectedResponse => {
      if (mapping['unsecure-cookies']) {
        unsecureCookies(redirectedResponse.headers)
      }
      const { headers: responseHeaders } = redirectedResponse
      await mapping['after-forward']({ headers: responseHeaders })
      response.writeHead(redirectedResponse.statusCode, responseHeaders)
      redirectedResponse
        .on('error', fail)
        .on('end', done)
        .pipe(response)
    })
    redirectedRequest.on('error', fail)
    request
      .on('data', chunk => redirectedRequest.write(chunk))
      .on('error', fail)
      .on('end', () => { redirectedRequest.end() })
    return promise
  }
}
