require('./mocked_modules')
const { clean, collect } = require('./mocked_modules/console')

require('mock-require')('test-tools', {
  assert: require('./assert'),
  wrapHandler: require('./wrap-handler'),
  http: require('./http'),
  console: {
    clean,
    collect
  }
})
