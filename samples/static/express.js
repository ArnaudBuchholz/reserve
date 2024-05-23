const { join } = require('path')
const express = require('express')
const { EXPRESS_PORT: PORT } = require('./ports.js')

const app = express()
const wwwRoot = join(__dirname, 'www')

app.use(express.static(wwwRoot))

app.get('/hello', (req, res) => res.send('Hello World !'))

app.listen(PORT, () => console.log(`express listening on port ${PORT}`))
