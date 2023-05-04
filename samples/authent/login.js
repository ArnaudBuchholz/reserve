'use strict'

const { body } = require('reserve')
const jose = require('jose')
const { setCookie, names: { jwt: $jwt } } = require('./cookies')
const { toLogin, toStartup } = require('./redirect')
const { check } = require('./password')

module.exports = async function login (request, response) {
  const jwtExpiration = parseInt(process.env.JWT_EXPIRATION || '3600', 10)
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
      .sign(Buffer.from(process.env.JWT_SECRET))
    setCookie(response, {
      name: $jwt,
      value: jwt
    })
    toStartup(request, response)
  } catch (e) {
    toLogin(request, response)
  }
}
