require('dotenv')
const jose = require('jose')
const { getAllCookies } = require('./cookies')
const { toLogin } = require('redirect')

const xJwt = 'x-jwt'

module.exports = {
  async isAuthenticated (request, response) {
    try {
      const token = getAllCookies(request)[xJwt]
      const { payload } = await jose.jwtVerify(token, Buffer.from(process.env.JWT_SECRET))
      request.jwt = payload
    } catch (e) {
      toLogin(request, response)
    }
  }
}
