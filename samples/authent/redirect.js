'use strict'

const { getAllCookies, setCookie, names: { redirect: $redirect } } = require('./cookies')

function redirect (response, location) {
  response.writeHead(302, { location })
  response.end()
}

module.exports = {
  toStartup (request, response) {
    const location = getAllCookies(request)[$redirect] || '/'
    setCookie(response, {
      name: $redirect,
      value: ''
    })
    redirect(response, location)
  },

  toLogin (request, response) {
    setCookie(response, {
      name: $redirect,
      value: getAllCookies(request)[$redirect] || request.url.substring(1)
    })
    redirect(response, '/login.html')
  }
}
