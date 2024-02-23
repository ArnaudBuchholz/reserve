'use strict'

const interpolate = require('./helpers/interpolate')

const errors = 'Unknown event name|Invalid callback|Configured port $port already in use|Invalid mapping match|Invalid mapping invert-match|Invalid mapping if-match|Invalid mapping exclude-from-holding-list|Unknown handler for $mapping|Invalid method specification|No method specified (or left)|Invalid "$type" handler: redirect is not a function|Invalid listeners member, must be an array of functions|Invalid http2 setting|Configuration must be an object|iconfiguration.setMappings appears to be blocked|Missing property $name|Invalid type of property $name|Invalid custom handler, expected a function|index.html not a file|Invalid custom-file-system specification ($invalids}|Invalid caching-strategy name|Internal redirection impossible because the body is already consumed|Unexpected middleware signature|Unsupported encoding: $encoding|Invalid status'.split('|')

function newError (code, groups) {
  let message = errors[code]
  if (groups) {
    message = interpolate({ groups }, message)
  }
  const error = new Error(message)
  error.name = 'REserveError'
  error.code = code
  return error
}

function throwError (code) {
  throw newError(code)
}

module.exports = {
  throwError,
  newError,
  ERROR_EVENT_UNKNOWN_NAME: 0,
  ERROR_EVENT_INVALID_CALLBACK: 1,
  ERROR_SERVE_PORT_ALREADY_USED: 2,
  ERROR_MAPPING_INVALID_MATCH: 3,
  ERROR_MAPPING_INVALID_INVERT_MATCH: 4,
  ERROR_MAPPING_INVALID_IF_MATCH: 5,
  ERROR_MAPPING_INVALID_EXCLUDE_FROM_HOLDING_LIST: 6,
  ERROR_MAPPING_UNKNOWN_HANDLER: 7,
  ERROR_METHOD_INVALID: 8,
  ERROR_METHOD_NONE: 9,
  ERROR_CONFIG_INVALID_HANDLER: 10,
  ERROR_CONFIG_INVALID_LISTENERS: 11,
  ERROR_CONFIG_INVALID_HTTP2_SETTING: 12,
  ERROR_CONFIG_NOT_AN_OBJECT: 13,
  ERROR_ICONFIG_SET_MAPPINGS_BLOCKED: 14,
  ERROR_SCHEMA_MISSING_PROPERTY: 15,
  ERROR_SCHEMA_INVALID_TYPE: 16,
  ERROR_CUSTOM_EXPECTED_FUNCTION: 17,
  ERROR_FILE_INVALID_INDEX_HTML: 18,
  ERROR_FILE_FILE_SYSTEM_SETTING: 19,
  ERROR_FILE_CACHING_STRATEGY_SETTING: 20,
  ERROR_URL_BODY_CONSUMED: 21,
  ERROR_USE_UNSUPPORTED_MIDDLEWARE: 22,
  ERROR_CAPTURE_UNSUPPORTED_ENCODING: 23,
  ERROR_CAPTURE_INVALID_STATUS: 24
}
