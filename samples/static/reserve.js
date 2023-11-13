const { check, serve, log } = require('reserve')

check({
  "port": 8080,
  "mappings": [{
    "match": "^/(.*)",
    "file": "./www/$1"
  }]
})
  .then(configuration => serve(configuration))
