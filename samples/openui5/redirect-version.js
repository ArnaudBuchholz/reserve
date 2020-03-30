module.exports = async function (request, response, ui5Path) {
  const { referer } = request.headers
  const version = (/\bversion\b=(\d+\.\d+\.\d+)/.exec(referer) || [0, '1.76.0'])[1]
  response.writeHead(302, {
    Location: `https://openui5.hana.ondemand.com/${version}/resources/${ui5Path}`
  })
  response.end()
}
