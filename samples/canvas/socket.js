module.exports = (eventEmitter) => {
  eventEmitter.on('server-created', ({ server }) => {
    const io = require('socket.io')(server)
    let id = 0
    io.on('connection', socket => {
      socket.on('plot', body => {
        io.emit('plot', `${++id}|${body}`)
      })
    })
  })
}
