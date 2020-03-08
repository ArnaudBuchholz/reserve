require('colors')
const path = require('path')
const { log, read, serve } = require('..')
const [,, fileName = 'reserve'] = process.argv
read(path.join(process.env.INIT_CWD, `${fileName}.json`))
  .then(configuration => log(serve(configuration)))
  .catch(reason => console.error(reason.toString().red))
