'use strict'

module.exports = function (request, response) {
  if (this.configuration) {
    response.writeHead(200)
  } else {
    response.writeHead(500)
  }
  response.end()
}
