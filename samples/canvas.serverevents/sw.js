'use strict'

self.addEventListener('install', event => {
  console.log('installed, activating immediately')
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', event => {
  console.log('activated')
  event.waitUntil(self.clients.claim())
})

const plotsSource = new EventSource('/plots')
plotsSource.addEventListener('plot', e => {
  const { lastEventId, data } = e
  self.clients.matchAll().then(clients => clients.forEach(client => {
    client.postMessage({ type: 'plot', lastEventId, data })
  }))
})
