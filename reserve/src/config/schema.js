'use strict'

const { throwError, ERROR_SCHEMA_MISSING_PROPERTY, ERROR_SCHEMA_INVALID_TYPE } = require('../error')

function parseProperty (name, value) {
  let types
  const { defaultValue } = value
  if (typeof value === 'string') {
    types = [value]
  } else if (Array.isArray(value)) {
    types = value
  } else {
    types = value.types || [value.type || 'string']
  }
  return { name, types, defaultValue }
}

function validateProperty (property, object, value = property.defaultValue) {
  const { name, types } = property
  if (value === undefined) {
    throwError(ERROR_SCHEMA_MISSING_PROPERTY, { name })
  }
  const valueType = typeof value
  if (!types.includes(valueType)) {
    throwError(ERROR_SCHEMA_INVALID_TYPE, { name })
  }
  object[property.name] = value
}

function parse (schema) {
  return Object.keys(schema).map(name => parseProperty(name, schema[name]))
}

function validate (schema, object) {
  schema.forEach(property => validateProperty(property, object, object[property.name]))
}

function notTrueOrUndefined (value) {
  return value !== true && value !== undefined
}

module.exports = {
  parse,
  validate,
  notTrueOrUndefined
}
