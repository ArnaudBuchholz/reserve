'use strict'

const $configuration = Symbol('configuration')

module.exports = class IConfiguration {
  constructor (configuration) {
    this[$configuration] = configuration
  }
}
