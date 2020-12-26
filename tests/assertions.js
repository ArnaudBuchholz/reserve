(function () {
  'use strict'

  /* global assert, gpf, location */

  function tryLoad (url, validate) {
    return gpf.http.get(location.origin + url)
      .then(function (response) {
        if (response.status !== 200) {
          throw new Error(url + ' ' + response.status)
        }
        if (validate) {
          validate(response.responseText)
        }
        assert(true, url)
      })
  }

  function checkFileStatus (url, statusCode) {
    return gpf.http.get(location.origin + url)
      .then(function (response) {
        if (response.status !== statusCode) {
          throw new Error(url + ' ' + response.status)
        }
        assert(true, url)
      })
  }

  function checkFileNotFound (url) {
    return checkFileStatus(url, 404)
  }

  module.exports = function assertions () {
    return tryLoad('/mappings.json', JSON.parse)
      .then(function () { return tryLoad('/proxy/https/arnaudbuchholz.github.io/blog/jsfiddle-assert.js') })
      .then(function () { return tryLoad('/Hello World.txt') })
      .then(function () { return checkFileNotFound('/not-found') })
      .then(function () { return checkFileNotFound('/no-index') })
      .then(function () {
        const token = encodeURIComponent((new Date()).toString())
        return tryLoad('/echo/' + token, function (content) {
          if (content !== token) {
            throw new Error('Echo service is not working')
          }
        })
      })
  }
}())
