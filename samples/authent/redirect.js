'use strict'

const { getAllCookies, setCookie } = require('./cookies')

const xRedirect = 'x-redirect'

module.exports = {
  toLogin (request, response) {
    const redirect = getAllCookies(request)[xRedirect] || request.url.substring(1)
    setCookie(response, { name: xRedirect, value: redirect })
    response.writeHead(302, { location: '/login' })
    response.end()
  }
}
