(function () {
  'use strict'

  /* global EventSource, localStorage */

  const title = document.title

  const $prefix = 'SharedEventSource.'
  const $lastId = `${$prefix}lastId`
  const $master = `${$prefix}master`
  const $ping = `${$prefix}ping`

  let isMaster
  let timer

  function tick () {
    if (timer !== undefined) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      timer = undefined
      if (isMaster) {
        localStorage[$ping] = localStorage[$ping] === '0' ? '1' : '0'
        tick()
      } else {
        setMaster(true)
      }
    }, isMaster ? 100 : 200)
  }

  function setMaster (value) {
    if (value) {
      document.title = `[${id} - master] ${title}`
    } else {
      document.title = `[${id}] ${title}`
    }
    if (isMaster !== value) {
      isMaster = value
      tick()
    }
    if (isMaster) {
      localStorage[$master] = id
    }
  }

  const handlers = {
    [$master]: event => {
      const candidateId = parseInt(event.newValue, 10)
      if (candidateId < id) {
        setMaster(false)
      } else {
        setMaster(true)
      }
    },
    [$ping]: event => {
      tick()
    }
  }

  window.addEventListener('storage', event => {
    const handler = handlers[event.key]
    if (handler) {
      handler(event)
    }
  })

  // Assuming the following algorithm generate a unique ID
  const id = parseInt(localStorage[$lastId] || '0', 10) + 1
  localStorage[$lastId] = id

  setMaster(true)

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
