'use strict'

const mime = require('../detect/mime')
const interpolate = require('../interpolate')
const textMimeType = mime.getType('text')
const byStatus = {
  403: 'Forbidden',
  404: 'Not found',
  405: 'Method Not Allowed',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  508: 'Loop Detected'
}

module.exports = {
  schema: {
    status: 'number',
    headers: {
      type: 'object',
      defaultValue: {}
    }
  },
  redirect: async function ({ mapping, match, response, redirect }) {
    const statusCode = redirect
    const content = byStatus[statusCode] || ''
    const length = content.length
    const headers = mapping ? mapping.headers : undefined
    response.writeHead(statusCode, {
      'Content-Type': textMimeType,
      'Content-Length': length,
      ...interpolate(match, headers)
    })
    response.end(content)
  }
}
