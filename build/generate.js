const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')

const nodeApi = readFileSync(join(__dirname, '../src/node-api.js')).toString()
const core = readFileSync(join(__dirname, '../dist/core.js')).toString()
const imports = {}

nodeApi.replace(/const ([^=]+) = require\('([^']+)'\)/g, (match, imported, id) => {
  if (imported.startsWith('{')) {
    imported = imported.match(/{ (.*) }/)[1].split(', ')
  }
  imports[id] = imported
})

writeFileSync(join(__dirname, '../dist/index.js'), [
  '\'use strict\'',
  ...Object.keys(imports).map(module => {
    const imported = imports[module]
    if (Array.isArray(imported)) {
      return `const {${imported.join(',')}}=require('${module}')`
    }
    return `const ${imported}=require('${module}')`
  }),
  core,
  'module.exports=reserve'
].join('\n'), { flag: 'w' })

writeFileSync(join(__dirname, '../dist/index.mjs'), [
  ...Object.keys(imports).map(module => {
    const imported = imports[module]
    if (Array.isArray(imported)) {
      return `import {${imported.join(',')}} from '${module}'`
    }
    return `import ${imported} from '${module}'`
  }),
  core,
  'export default reserve'
].join('\n'), { flag: 'w' })
  