require('./mocked_modules')
const { clean, collect } = require('./mocked_modules/console')

function cleanRequireCache () {
  Object.keys(require.cache).forEach(path => {
    delete require.cache[path]
  })
}

require('mock-require')('test-tools', {
  notExpected: () => { throw new Error('Not expected') },
  wrapHandler: require('./wrap-handler'),
  http: require('./http'),
  console: {
    clean,
    collect
  },
  cleanRequireCache
})
