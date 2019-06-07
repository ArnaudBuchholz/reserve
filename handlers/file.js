'use strict'

const mime = require('mime')

module.exports = {
  schema: {},
  redirect: (request, response) => {
    const filePath = /([^?]+)/.exec(request.redirect)[1]
    fs.stat(filePath, (err, stat) => {
      if (err || stat.isDirectory()) {
        error(request, response, { status: 404, message: 'Not found' })
      } else {
        response.writeHead(200, {
          'Content-Type': mime.getType(path.extname(filePath)) || mime.getType('bin'),
          'Content-Length': stat.size
        })
        fs.createReadStream(filePath)
          .on('end', () => log(request, response, stat.size))
          .pipe(response)
      }
    })
  }
}
