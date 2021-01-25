const path = require('path')
const express = require('express')
const app = express()
const port = 8081
const wwwRoot = path.join(__dirname, 'www')
app.use(express.static(wwwRoot))
app.get('/', (req, res) => res.sendFile(path.join(wwwRoot, 'static.html')))
app.listen(port, () => console.log(`Listening on port ${port}!`))
