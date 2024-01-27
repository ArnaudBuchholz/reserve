import smartImport from '../../src/smartImport.js'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main () {
  const func = await smartImport(join(__dirname, './import.js'))
  console.log(func())
}

main()
  .catch(reason => console.error(reason))
