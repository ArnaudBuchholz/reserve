'use strict'

module.exports = {
  getAllCookies (request) {
    const cookiesStr = request.headers.cookie
    if (cookiesStr) {
      return cookiesStr
        .split(';')
        .map(cookie => cookie.trim())
        .reduce((cookies, cookie) => {
          const [, name, value] = cookie.match(/(\w+)=(.*)/)
          cookies[name] = decodeURI(value)
          return cookies
        }, {})
    }
    return {}
  },

  setCookie (response, { name, value, maxAge }) {
    if (maxAge) {
      maxAge = `; Max-Age= ${maxAge}`
    } else {
      maxAge = ''
    }
    const encoded = `${name}=${encodeURI(value)}${maxAge}; HttpOnly; SameSite=Strict`
    let allCookies = response.getHeader('Set-Cookie')
    if (!allCookies) {
      allCookies = [encoded]
    } else {
      if (!Array.isArray(allCookies)) {
        allCookies = [allCookies]
      }
      allCookies.push(encoded)
    }
    response.setHeader('Set-Cookie', allCookies)
  }
}
