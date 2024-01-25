module.exports = (eventEmitter) => {
  eventEmitter.on('created', ({ server }) => {
    const io = require('socket.io')(server)

    const plots = require('./plots')
    plots.on('plot', ({ id, plot }) => {
      io.emit('plot', `${id}|${plot}`)
    })

    io.on('connection', socket => {
      plots.forEach(({ id, plot }) => socket.emit('plot', `${id}|${plot}`))
      socket.on('plot', plot => plots.push(plot))
    })
  })
}
