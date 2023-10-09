const { join } = require('path')
const { mkdirSync, writeFileSync } = require('fs')
const root = join(__dirname, '..')
mkdirSync(join(root, 'node_modules/reserve'), { recursive: true })
const reserve = require(join(root, 'package.json'))
reserve.main = join(root, reserve.main)
reserve.types = join(root, reserve.types)
writeFileSync(join(root, 'node_modules/reserve/package.json'), JSON.stringify(reserve, undefined, 2), { flag: 'w' })
