(function () {
  'use strict'

  /* global EventSource */

  const title = document.title

  // Assuming the following algorithm generate a unique ID
  const id = parseInt(localStorage['SharedEventSource.lastId'] || '0', 10) + 1
  localStorage['SharedEventSource.lastId'] = id

  let isMaster = false

  localStorage['SharedEventSource.master'] = id
  document.title = `[${id} - master] ${title}`

  window.addEventListener('storage', event => {
    if (event.key === 'SharedEventSource.master') {
      if (parseInt(event.newValue, 10) < id) {
        document.title = `[${id}] ${title}`
      } else {
        localStorage['SharedEventSource.master'] = id
        document.title = `[${id} - master] ${title}`
      }
    }
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
