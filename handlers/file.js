'use strict'

const mime = require('mime')

module.exports = {
  schema: {},
  redirect: (request, response) => new Promise((resolve, reject) => {
    const filePath = /([^?]+)/.exec(request.redirect)[1]
    fs.stat(filePath, (err, stat) => {
      if (err || stat.isDirectory()) {
        reject(404)
      } else {
        response.writeHead(200, {
          'Content-Type': mime.getType(path.extname(filePath)) || mime.getType('bin'),
          'Content-Length': stat.size
        })
        fs.createReadStream(filePath)
          .on('end', resolve)
          .pipe(response)
      }
    })
  })
}
