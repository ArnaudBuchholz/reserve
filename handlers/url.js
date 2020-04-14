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
    if (typeof mapping[hookName] !== 'function') {
      throw new Error(`Invalid value for hook '${hookName}', expected a function`)
    }
  }
}

module.exports = {
  schema: {
    'unsecure-cookies': {
      type: 'boolean',
      defaultValue: false
    },
    'before-request': {
      types: ['function', 'string'],
      defaultValue: noop
    }
  },
  validate: async mapping => {
    validateHook(mapping, 'before-request')
  },
  redirect: ({ mapping, redirect: url, request: { method, headers }, response }) => new Promise((resolve, reject) => {
    delete headers.host // Some websites rely on the host header
    const request = {
      method,
      url,
      headers
    }
console.log(mapping)
    mapping['before-request']()
    const redirectedRequest = protocol(request.url).request(request.url, request, redirectedResponse => {
      if (mapping['unsecure-cookies']) {
        unsecureCookies(redirectedResponse.headers)
      }
      response.writeHead(redirectedResponse.statusCode, redirectedResponse.headers)
      redirectedResponse
        .on('error', reject)
        .on('end', resolve)
        .pipe(response)
    })
    redirectedRequest.on('error', reject)
    request
      .on('data', chunk => redirectedRequest.write(chunk))
      .on('error', reject)
      .on('end', () => { redirectedRequest.end() })
  })
}
