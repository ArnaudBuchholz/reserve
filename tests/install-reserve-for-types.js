const { join } = require('path')
const { mkdirSync, createReadStream, createWriteStream } = require('fs')
const root = join(__dirname, '..')
mkdirSync(join(root, 'node_modules/reserve'), { recursive: true })
mkdirSync(join(root, 'node_modules/@types/reserve'), { recursive: true })
function copy (src, dst) {
  createReadStream(join(root, src)).pipe(createWriteStream(join(root, dst)))
}
copy('package.json', 'node_modules/reserve/package.json')
copy('@types/index.d.ts', 'node_modules/@types/reserve/index.d.ts')
