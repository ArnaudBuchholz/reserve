'use strict'

const { describe, it } = require('mocha')
const assert = require('assert')
const { parse, validate } = require('./schema')

/* istanbul ignore next */ // Will not be called
function noop () {}

describe('schema', () => {
  describe('parsing', () => {
    it('expands property reduced to a type specification', () => {
      const schema = parse({
        property: 'string'
      })
      assert.strictEqual(schema[0].name, 'property')
      assert.strictEqual(schema[0].types.length, 1)
      assert.strictEqual(schema[0].types[0], 'string')
    })

    it('expands property reduced to a type specification list', () => {
      const schema = parse({
        property: ['function', 'string']
      })
      assert.strictEqual(schema[0].name, 'property')
      assert.strictEqual(schema[0].types.length, 2)
      assert.ok(schema[0].types.includes('string'))
      assert.ok(schema[0].types.includes('function'))
    })

    it('expands an object property with the name and default type', () => {
      const schema = parse({
        property: {}
      })
      assert.strictEqual(schema[0].name, 'property')
      assert.strictEqual(schema[0].types.length, 1)
      assert.strictEqual(schema[0].types[0], 'string')
    })

    it('expands an object property with the name and type', () => {
      const schema = parse({
        property: {
          type: 'boolean'
        }
      })
      assert.strictEqual(schema[0].name, 'property')
      assert.strictEqual(schema[0].types.length, 1)
      assert.strictEqual(schema[0].types[0], 'boolean')
    })

    it('expands an object property with the name and types', () => {
      const schema = parse({
        property: {
          types: ['function', 'string']
        }
      })
      assert.strictEqual(schema[0].name, 'property')
      assert.strictEqual(schema[0].types.length, 2)
      assert.ok(schema[0].types.includes('string'))
      assert.ok(schema[0].types.includes('function'))
    })
  })

  describe('validate', () => {
    function parseAndCheck (schema, object, shouldSucceed = true) {
      let exceptionCaught
      let parsedSchema
      try {
        parsedSchema = parse(schema)
        validate(parsedSchema, object)
      } catch (e) {
        exceptionCaught = e
      }
      if (shouldSucceed) {
        assert.ok(!exceptionCaught)
      } else {
        assert.ok(!!exceptionCaught)
      }
      return parsedSchema
    }

    function succeeds (schema, object) {
      return () => parseAndCheck(schema, object, true)
    }

    function fails (schema, object) {
      return () => parseAndCheck(schema, object, false)
    }

    describe('required properties', () => {
      it('checks that the property exists', fails({ property: 'boolean' }, {}))
    })

    describe('type', () => {
      it('accepts correct type (boolean)', succeeds({ property: 'boolean' }, { property: false }))
      it('rejects incorrect type (boolean)', fails({ property: 'boolean' }, { property: 123 }))
      it('accepts correct type (function)', succeeds({ property: 'function' }, { property: noop }))
      it('rejects incorrect type (function)', fails({ property: 'function' }, { property: 123 }))
      it('accepts correct type (number)', succeeds({ property: 'number' }, { property: 123 }))
      it('reject incorrect type (number)', fails({ property: 'number' }, { property: noop }))
      it('accepts correct type (string)', succeeds({ property: 'string' }, { property: 'Hello World!' }))
      it('rejects incorrect type (string)', fails({ property: 'string' }, { property: 123 }))
      it('accepts one of several types (boolean, string), boolean use', succeeds({ property: ['boolean', 'string'] }, { property: false }))
      it('accepts one of several types (boolean, string), string use', succeeds({ property: ['boolean', 'string'] }, { property: 'false' }))
      it('rejects incorrect types (boolean, string), number use', fails({ property: ['boolean', 'string'] }, { property: 0 }))
    })

    describe('defaultValue', () => {
      it('uses value when set', () => {
        const object = { property: true }
        parseAndCheck({
          property: {
            type: 'boolean',
            defaultValue: false
          }
        }, object)
        assert.strictEqual(object.property, true)
      })

      it('sets value when missing', () => {
        const object = {}
        parseAndCheck({
          property: {
            type: 'boolean',
            defaultValue: false
          }
        }, object)
        assert.strictEqual(object.property, false)
      })
    })
  })
})
