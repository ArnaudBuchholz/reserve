'use strict'

module.exports = {
  check (user, password) {
    if (user === 'arnaud') {
      return password === '42'
    }
    return false
  }
}
