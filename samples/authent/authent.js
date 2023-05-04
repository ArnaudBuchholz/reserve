require('dotenv')
const jose = require('jose')
const { getAllCookies, names: { jwt: $jwt } } = require('./cookies')
const { toLogin } = require('redirect')

module.exports = {
  async isAuthenticated (request, response) {
    try {
      const token = getAllCookies(request)[$jwt]
      const { payload } = await jose.jwtVerify(token, Buffer.from(process.env.JWT_SECRET))
      request.jwt = payload
      return true
    } catch (e) {
      toLogin(request, response)
    }
    return false
  }
}
