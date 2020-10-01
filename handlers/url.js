'use strict'

const http = require('http')
const https = require('https')

const uncook = 'unsecure-cookies'
const fwdreq = 'forward-request'
const fwdres = 'forward-response'
const icert = 'ignore-unverifiable-certificate'

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
    [uncook]: {
      type: 'boolean',
      defaultValue: false
    },
    [fwdreq]: {
      types: ['function', 'string'],
      defaultValue: noop
    },
    [fwdres]: {
      types: ['function', 'string'],
      defaultValue: noop
    },
    [icert]: {
      type: 'boolean',
      defaultValue: false
    }
  },
  validate: async mapping => {
    validateHook(mapping, fwdreq)
    validateHook(mapping, fwdres)
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
    if (mapping[icert]) {
      options.rejectUnauthorized = false
    }
    const context = {}
    await mapping[fwdreq]({ configuration, context, mapping, match, request: options, incoming: request })
    const redirectedRequest = protocol(options.url).request(options.url, options, async redirectedResponse => {
      if (mapping[uncook]) {
        unsecureCookies(redirectedResponse.headers)
      }
      const { headers: responseHeaders } = redirectedResponse
      await mapping[fwdres]({ configuration, context, mapping, match, headers: responseHeaders })
      response.writeHead(redirectedResponse.statusCode, responseHeaders)
      response.on('finish', done)
      redirectedResponse
        .on('error', fail)
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
