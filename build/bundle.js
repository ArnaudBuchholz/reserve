'use strict'

const { mkdirSync, readFileSync, writeFileSync } = require('fs')
const { dirname, join } = require('path')

const stack = ['index.js']
const modules = {}

while (stack.length) {
  const path = stack.shift()
  if (Object.keys(modules).includes(path)) {
    continue
  }
  const content = readFileSync(join('src', path)).toString()
  const module = {
    content,
    depends: {}
  }
  const dynamic = []
  const native = {}
  content.replace(/require\(\s*(.*)\s*\)/g, (instruction, dependency) => {
    if (dependency.startsWith('\'')) {
      const id = dependency.match(/^'(.*)'$/)[1]
      const re = `(:?(\\w+|\\{[^}]+\\})\\s*(?:=|:)\\s*)?require\\('${id.replace(/\//g, '\\/')}'\\)`
      let imports = ''
      try {
        imports = content.match(new RegExp(re), 'i')[1] || 'as-is'
      } catch (e) {
        console.error(e.toString(), path, re, id)
        throw e
      }
      if (id.startsWith('.')) {
        const depend = join(dirname(path), `${id}.js`).replace(/\\/g, '/')
        module.depends[depend] = imports
        stack.push(depend)
      } else {
        native[id] = imports
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
  module.path = path
  module.exports = `$export_${path.replace('.js', '').replace('/', '_')}`
  modules[path] = module
}

mkdirSync('dist', { recursive: true })
writeFileSync('dist/bundle.json', JSON.stringify(modules, undefined, 2))
writeFileSync('dist/core.js', '')

const written = ['index.js', 'dependencies.js']
const remaining = Object.values(modules).filter(({ path }) => !written.includes(path))

while (remaining.length) {
  const pos = remaining.findIndex(module => Object.keys(module.depends).every(dep => written.includes(dep)))
  if (pos === -1) {
    console.error('Unable to complete.')
    process.exit(-1)
  }
  const { path, content, exports } = remaining[pos]
  remaining.splice(pos, 1)
  written.push(path)
  writeFileSync('dist/core.js', `// BEGIN OF ${path}\n`, { flag: 'a' })
  const transformed = content
    .replace(/'use strict'\s*\n/g, '') // No more required
    .replace(/const [^\n]*= require\('[^']+dependencies'\)/g, dependencies => `// ${dependencies}`) // No more required
    .replace('module.exports', `const ${exports}`) // Convert to variable
  writeFileSync('dist/core.js', transformed, { flag: 'a' })
  writeFileSync('dist/core.js', `\n// END OF ${path}\n`, { flag: 'a' })
}

console.log('Done.')
