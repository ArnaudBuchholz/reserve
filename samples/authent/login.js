'use strict'

const { jwtExpiration, jwtSecret } = require('./config')
const { body } = require('../..') // use require('reserve')
const jose = require('jose')
const { setCookie, names: { jwt: $jwt } } = require('./cookies')
const { toLogin, toStartup } = require('./redirect')
const { check } = require('./password')

module.exports = async function login (request, response) {
  try {
    const payload = new URLSearchParams(await body(request))
    const user = payload.get('u')
    const password = payload.get('p')
    if (!check(user, password)) {
      throw new Error('wrong password')
    }
    const jwt = await new jose.SignJWT({
      user
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(Date.now() + jwtExpiration * 1000)
      .sign(jwtSecret)
    setCookie(response, {
      name: $jwt,
      value: jwt
    })
    toStartup(request, response)
  } catch (e) {
    toLogin(request, response)
  }
}
