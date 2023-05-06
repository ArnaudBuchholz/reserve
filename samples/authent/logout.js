'use strict'

const { setCookie, names: { jwt: $jwt } } = require('./cookies')
const { toStartup } = require('./redirect')

module.exports = async function logout (request, response) {
  setCookie(response, {
    name: $jwt,
    value: ''
  })
  toStartup(request, response)
}
