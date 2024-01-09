const { join } = require('path')
const express = require('express')

const app = express()
const port = 8081
const wwwRoot = join(__dirname, 'www')

app.use(express.static(wwwRoot))

app.get('/', (req, res) => res.sendFile(join(wwwRoot, 'index.html')))

app.get('/hello', (req, res) => res.send('Hello World !'))

app.listen(port, () => console.log(`express listening on port ${port}`))
