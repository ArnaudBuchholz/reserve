'use strict'

const interpolate = require('../helpers/interpolate')
const { $handlerPrefix } = require('../symbols')
const send = require('../helpers/send')

const byStatus = {
  403: 'Forbidden',
  404: 'Not found',
  405: 'Method Not Allowed',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  508: 'Loop Detected'
}

module.exports = {
  [$handlerPrefix]: 'status',
  schema: {
    status: 'number',
    headers: {
      type: 'object',
      defaultValue: {}
    }
  },
  redirect: function ({ mapping, match, response, redirect }) {
    return send(response, byStatus[redirect] || '', {
      statusCode: redirect,
      headers: { ...interpolate(match, mapping ? mapping.headers : undefined) }
    })
  }
}
