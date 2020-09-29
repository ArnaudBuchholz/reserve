'use strict'

const assert = require('./assert')
const { format, parse } = require('../../mtime')

const dates = [{
  d: new Date(Date.UTC(2015, 9, 21, 7, 28, 0, 0)),
  t: 'Wed, 21 Oct 2015 07:28:00 GMT'
}, {
  d: new Date(Date.UTC(2003, 0, 21, 23, 35, 8, 0)),
  t: 'Tue, 21 Jan 2003 23:35:08 GMT'
}]

describe('mtime', () => {
  describe('format', () => {
    dates.forEach(date => it(`formats '${date.t}'`, () => {
      assert(() => format(date.d) === date.t)
    }))
  })

  describe('parse', () => {
    dates.forEach(date => it(`parses '${date.t}'`, () => {
      assert(() => parse(date.t).getTime() === date.d.getTime())
    }))
  })
})
