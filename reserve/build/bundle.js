'use strict'

const { mkdirSync, readFileSync, writeFileSync } = require('fs')
const { dirname, join } = require('path')

const stack = ['index.js']
const modules = {
  punycache: {
    path: 'punycache',
    depends: [],
    exports: 'punycache',
    content: readFileSync('../node_modules/punycache/punycache.js').toString()
  }
}

while (stack.length) {
  const path = stack.shift()
  if (Object.keys(modules).includes(path)) {
    continue
  }
  const content = readFileSync(join('src', path))
    .toString()
    .replace(/Symbol\([^)]*\)/g, 'Symbol()') // No need to keep symbol key
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
  if (path === 'index.js') {
    module.exports = 'reserve'
  } else {
    module.exports = `$export_${path.replace('.js', '').replace('/', '_')}`
    const exportNames = []
    const exportValues = []
    const exports = content.match(/module\.exports\s+=\s+\{([^^}]*)\}/)
    if (exports !== null && !path.startsWith('handlers/')) {
      const [, exported] = exports
      exported
        .split('\n')
        .map(line => line.trim())
        .filter(line => !!line)
        .filter(line => !line.startsWith('//'))
        .forEach(line => {
          const [name, value] = line.replace(',', '').split(': ')
          if (!name.match(/^\$?\w+$/i)) {
            throw new Error(`Invalid export "${name}" for module ${path}`)
          }
          exportNames.push(name)
          exportValues.push(value)
        })
    }
    if (exportNames.length) {
      module['exports.names'] = exportNames
      module['exports.values'] = exportValues
    }
  }
  modules[path] = module
}

mkdirSync('dist', { recursive: true })
writeFileSync('dist/bundle.json', JSON.stringify(modules, undefined, 2))

const nodeApi = readFileSync(join(__dirname, '../src/node-api.js')).toString()
const imports = []
nodeApi.replace(/const ([^=]+) = require\('([^']+)'\)/g, (match, imported, id) => {
  if (imported.startsWith('{')) {
    imports.push(...imported.match(/{ (.*) }/)[1].split(', '))
  } else {
    imports.push(imported)
  }
})

const promisified = []
nodeApi.replace(/(\w+): promisify\(\w+\)/g, (match, api) => promisified.push(api))

writeFileSync('dist/core.js', `module.exports=function({${imports.join(',')}}){\n`)
promisified.forEach(api => writeFileSync('dist/core.js', `${api}=promisify(${api})\n`, { flag: 'a' }))

const written = ['node-api.js']
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
  const transformed = `const ${exports} = (() => {${content
    .replace(/'use strict'\s*\n/g, '') // No more required
    .replace(/const [^\n]*= require\('[^']+node-api'\)/g, dependencies => '') // No more required
    .replace(/module\.exports\s*=/, 'return')
    .replace(/require\('([^']*)'\)/g, (match, id) => {
      if (id.endsWith('node-api')) {
        return match
      }
      if (modules[id]) {
        return modules[id].exports
      }
      const depPath = join(dirname(path), id).replace('\\', '/') + '.js'
      const moduleName = Object.keys(modules)
        .filter(path => depPath.endsWith(path))
        .sort((name1, name2) => name2.length - name1.length)[0] // keep longer match
      if (moduleName !== undefined) {
        return modules[moduleName].exports
      }
      throw new Error(`Unexpected require '${id}'`)
    })
  }})()`
  writeFileSync('dist/core.js', transformed, { flag: 'a' })
  writeFileSync('dist/core.js', `\n// END OF ${path}\n`, { flag: 'a' })
}

writeFileSync('dist/core.js', 'return reserve}', { flag: 'a' })

console.log('Done.')
