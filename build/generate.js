const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')

const nodeApi = readFileSync(join(__dirname, '../src/node-api.js')).toString()
const core = readFileSync(join(__dirname, '../dist/core.js')).toString()

const imports = {}
const promisified = []

nodeApi.replace(/const ([^=]+) = require\('([^']+)'\)/g, (match, imported, id) => {
  if (imported.startsWith('{')) {
    imported = imported.match(/{ (.*) }/)[1].split(', ')
  }
  imports[id] = imported
})
nodeApi.replace(/(\w+): promisify\(\w+\)/g, (match, api) => promisified.push(api))

writeFileSync(join(__dirname, '../dist/index.js'), [
  '\'use strict\'',
  ...Object.keys(imports).map(module => {
    const imported = imports[module]
    if (Array.isArray(imported)) {
      return `const {${imported.map(api => promisified.includes(api) ? `${api}:${api}CB`: api).join(',')}}=require('${module}')`
    }
    return `const ${imported}=require('${module}')`
  }),
  ...promisified.map(api => `const ${api}=promisify(${api}CB)`),
  core,
  'module.exports=reserve'
].join('\n'), { flag: 'w' })

writeFileSync(join(__dirname, '../dist/index.mjs'), [
  ...Object.keys(imports).map(module => {
    const imported = imports[module]
    if (Array.isArray(imported)) {
      return `import {${imported.map(api => promisified.includes(api) ? `${api} as ${api}CB`: api).join(',')}} from '${module}'`
    }
    return `import ${imported} from '${module}'`
  }),
  ...promisified.map(api => `const ${api}=promisify(${api}CB)`),
  core,
  'export default reserve'
].join('\n'), { flag: 'w' })
  