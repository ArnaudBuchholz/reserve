'use strict'

function parseProperty (name, value) {
  let types
  if (typeof value === 'string') {
    types = [value]
  } else if (Array.isArray(value)) {
    types = value
  } else {
    types = value.types || [value.type || 'string']
  }
  return { name, types }
}

function validate (property, object, value = property.defaultValue) {
  const { name, types } = property
  if (value === undefined) {
    throw new Error(`Missing property ${name}`)
  }
  const valueType = typeof value
  if (!types.includes(valueType)) {
    throw new Error(`Invalid type of property ${name}`)
  }
  object[property.name] = value
}

module.exports = {
  parse (schema) {
    return Object.keys(schema).map(name => parseProperty(name, schema[name]))
  },

  validate (schema, object) {
    schema.forEach(property => validate(property, object, object[property.name]))
  }
}
