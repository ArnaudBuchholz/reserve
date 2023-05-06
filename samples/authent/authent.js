'use strict'

const { jwtSecret } = require('./config')
const jose = require('jose')
const { getAllCookies, names: { jwt: $jwt } } = require('./cookies')
const { toLogin } = require('./redirect')

module.exports = async function isAuthenticated (request, response) {
  try {
    const token = getAllCookies(request)[$jwt]
    const { payload } = await jose.jwtVerify(token, jwtSecret)
    request.jwt = payload
  } catch (e) {
    toLogin(request, response)
  }
}
