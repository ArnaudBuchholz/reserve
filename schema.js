'use strict'

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

function parseProperty (name, value) {
  if (typeof value === 'string') {
    return { name, types: [ value ]}
  }
}

module.exports = (schema, object) => {
  Object.keys(schema).map(name => parseProperty(name, schema[name]))
    .forEach(property => validate(property, object, object[property.name]))
}
