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

module.exports = {
  schema: {
    'unsecure-cookies': 'boolean'
  },
  redirect: ({ mapping, redirect, request, response }) => new Promise((resolve, reject) => {
    const url = redirect
    const {
      method,
      headers
    } = request
    delete headers.host // Some websites rely on the host header
    const redirectedRequest = protocol(url).request(url, { method, headers }, redirectedResponse => {
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
      .on('end', () => {
        redirectedRequest.end()
      })
  })
}
