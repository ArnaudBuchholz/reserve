require('./mocked_modules')

require('mock-require')('test-tools', {
  assert: require('./assert'),
  wrapHandler: require('./wrap-handler'),
  http: require('./http')
})
