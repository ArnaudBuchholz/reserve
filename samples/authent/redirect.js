'use strict'

const { getAllCookies, setCookie, names: { redirect: $redirect } } = require('./cookies')

function redirect (response, location) {
  response.writeHead(302, { location })
  response.end()
}

module.exports = {
  toStartup (request, response) {
    const location = getAllCookies(request)[$redirect] || '/'
    redirect(response, location)
  },

  toLogin (request, response) {
    const redirect = getAllCookies(request)[$redirect] || request.url.substring(1)
    setCookie(response, { name: $redirect, value: redirect })
    redirect(response, '/login')
  }
}
