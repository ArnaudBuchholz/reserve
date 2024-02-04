'use strict'

module.exports = url => {
  if (url.indexOf('./') !== -1 || url.indexOf('%') !== -1 || url.indexOf('/') === -1) {
    try {
      const { pathname, search, hash } = new URL(url, 'p:/')
      url = decodeURIComponent(pathname.replace(/%(0|1)(\d|[a-f])/ig, '')) + search + hash
    } catch (e) {
      url = 400
    }
  }
  return url
}
