(function () {
  'use strict'

  /* global EventSource */

  const title = document.title
  const id = parseInt(localStorage['SharedEventSource.id'] || '0', 10) + 1
  localStorage['SharedEventSource.id'] = id

  document.title = `[${id}] ${title}`

  window.addEventListener('storage', event => {

  })

  class SharedEventSource {
    constructor (url) {
      this._eventSource = new EventSource(url)
    }

    addEventListener (event, callback) {
      this._eventSource.addEventListener(event, callback)
    }
  }

  window.SharedEventSource = SharedEventSource
}())
