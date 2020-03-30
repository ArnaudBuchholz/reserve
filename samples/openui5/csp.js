module.exports = async function (request, response) {
  response.setHeader('Content-Security-Policy', 'default-src \'self\'')
}
