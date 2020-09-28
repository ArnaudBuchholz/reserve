'use strict'

const { log, serve } = require('..')

log(serve({
  port: 8081,
  mappings: [{
    match: /^\/expired$/,
    'ignore-unverifiable-certificate': true,
    url: 'https://expired.badssl.com/'
  }]
}), true)
