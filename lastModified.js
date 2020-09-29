'use strict'

const days = 'Sun,Mon,Tue,Wed,Thu,Fri,Sat'.split(',')
const months = 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(',')
const pad = n => n.toString().padStart(2, '0')
const parser = /\w\w\w, (\d\d) (\w\w\w) (\d\d\d\d) (\d\d):(\d\d):(\d\d) GMT/

module.exports = {
  format (d) {
    return [
      days[d.getUTCDay()],
      ', ',
      pad(d.getUTCDate()),
      ' ',
      months[d.getUTCMonth()],
      ' ',
      d.getUTCFullYear(),
      ' ',
      pad(d.getUTCHours()),
      ':',
      pad(d.getUTCMinutes()),
      ':',
      pad(d.getUTCSeconds()),
      ' GMT'
    ].join('')
  },

  parse (t) {
    const [, date, monthName, fullYear, hours, minutes, seconds] = t.match(parser)
    const month = months.indexOf(monthName)
    return new Date(Date.UTC(fullYear, month, date, hours, minutes, seconds, 0))
  }
}
