module.exports = async function (request, response, ui5Path) {
  const { referer } = request.headers
  const version = (/\bversion\b=(\d+\.\d+\.\d+)/.exec(referer) || [0, '1.76.0'])[1]
  return `/@openui5/${version}/${ui5Path}`
}
