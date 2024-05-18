module.exports = async function (request, response, ui5Path) {
  const { referer } = request.headers
  const version = (/\bversion\b=(\d+\.\d+\.\d+)/.exec(referer) || [0, '1.71.68'])[1]
  response.writeHead(302, {
    Location: `https://ui5.sap.com/${version}/resources/${ui5Path}`
  })
  response.end()
}
