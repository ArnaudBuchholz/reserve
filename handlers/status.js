'use strict'

const mime = require('mime')
const textMimeType = mime.getType('text')
const byStatus = {
  '403': 'Forbidden',
  '404': 'Not found',
  '405': 'Method Not Allowed',
  '500': 'Internal Server Error'
}

module.exports = {
  schema: {
    status: 'number'
  },
  redirect: async function ({ response, redirect }) {
    const statusCode = redirect
    const content = byStatus[statusCode] || ''
    const length = content.length
    response.writeHead(statusCode, {
      'Content-Type': textMimeType,
      'Content-Length': length
    })
    response.end(content)
  }
}
