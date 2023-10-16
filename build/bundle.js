'use strict'

const { readFileSync, writeFileSync, mkdirSync } = require('fs')
const { join, dirname } = require('path')

const stack = ['index.js']
const modules = {}

while (stack.length) {
  const path = stack.shift()
  if (Object.keys(modules).includes(path)) {
    continue
  }
  const content = readFileSync(join('src', path)).toString()
  const module = {
    // content
  }
  const dynamic = []
  const native = {}
  content.replace(/require\(\s*(.*)\s*\)/g, (instruction, dependency) => {
    if (dependency.startsWith('\'')) {
      const id = dependency.match(/^'(.*)'$/)[1]
      if (id.startsWith('.')) {
        stack.push(join(dirname(path), `${id}.js`).replace(/\\/g, '/'))
      } else {
        const re = `(\\w+|\\{[^}]+\\})\\s*=\\s*require\\('${id.replace(/\//g, '\\/')}'\\)`
        try {
          const match = content.match(new RegExp(re), 'i')[1]
          native[id] = match
        } catch (e) {
          console.error(e.toString(), path, re, id)
          throw e
        }
      }
    } else {
      dynamic.push(instruction)
    }
  })
  if (Object.keys(native).length) {
    module.native = native
  }
  if (dynamic.length) {
    module.dynamic = dynamic
  }
  modules[path] = module
}

mkdirSync('dist', { recursive: true })
writeFileSync('dist/bundle.json', JSON.stringify(modules, undefined, 2))
