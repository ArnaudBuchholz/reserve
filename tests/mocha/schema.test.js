'use strict'

const assert = require('./assert')
const { parse, validate } = require('../../schema')

describe('schema', () => {
  describe('parsing', () => {
    it('expands property reduced to a type specification', () => {
      const schema = parse({
        property: 'string'
      })
      assert(() => schema[0].name === 'property')
      assert(() => schema[0].types.length === 1)
      assert(() => schema[0].types[0] === 'string')
    })

    it('expands property reduced to a type specification list', () => {
      const schema = parse({
        property: ['function', 'string']
      })
      assert(() => schema[0].name === 'property')
      assert(() => schema[0].types.length === 2)
      assert(() => schema[0].types.includes('string'))
      assert(() => schema[0].types.includes('function'))
    })

    it('expands an object property with the name and default type', () => {
      const schema = parse({
        property: {}
      })
      assert(() => schema[0].name === 'property')
      assert(() => schema[0].types.length === 1)
      assert(() => schema[0].types[0] === 'string')
    })

    it('expands an object property with the name and type', () => {
      const schema = parse({
        property: {
          type: 'boolean'
        }
      })
      assert(() => schema[0].name === 'property')
      assert(() => schema[0].types.length === 1)
      assert(() => schema[0].types[0] === 'boolean')
    })

    it('expands an object property with the name and types', () => {
      const schema = parse({
        property: {
          types: ['function', 'string']
        }
      })
      assert(() => schema[0].name === 'property')
      assert(() => schema[0].types.length === 2)
      assert(() => schema[0].types.includes('string'))
      assert(() => schema[0].types.includes('function'))
    })
  })

  describe('validate', () => {
    function check (schema, object, shouldSucceed) {
      var exceptionCaught
      try {
        validate(parse(schema), object)
      } catch (e) {
        exceptionCaught = e
      }
      if (shouldSucceed) {
        assert(() => !exceptionCaught)
      } else {
        assert(() => !!exceptionCaught)
      }
    }

    function succeeds (schema, object) {
      return () => check(schema, object, true)
    }

    function fails (schema, object) {
      return () => check(schema, object, false)
    }

    describe('type', () => {
      it('accepts correct type (boolean)', succeeds({ property: 'boolean' }, { property: false }))
      it('rejects incorrect type (boolean)', fails({ property: 'boolean' }, { property: 123 }))
      it('accepts correct type (function)', succeeds({ property: 'function' }, { property: () => {} }))
      it('rejects incorrect type (function)', fails({ property: 'function' }, { property: 123 }))
      it('accepts correct type (number)', succeeds({ property: 'number' }, { property: 123 }))
      it('reject incorrect type (number)', fails({ property: 'number' }, { property: () => {} }))
      it('accepts correct type (string)', succeeds({ property: 'string' }, { property: 'Hello World!' }))
      it('rejects incorrect type (string)', fails({ property: 'string' }, { property: 123 }))
    })
  })
})
