const EventEmitter = require('events')

class Plots extends EventEmitter {
  constructor () {
    super()
    this._plots = []
  }

  push (plot) {
    const id = this._plots.length
    this._plots.push(plot)
    this.emit('plot', { id, plot })
  }

  forEach (from, handler) {
    if (typeof from === 'function') {
      handler = from
      from = 0
    }
    this._plots.slice(from).forEach((plot, id) => handler({ id, plot }))
  }
}

module.exports = new Plots()
