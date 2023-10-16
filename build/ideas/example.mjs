import fs from 'fs'

const reserve = await (async function () {
  const { readFile } = fs
  console.log(readFile)
  const value1 = await import('./test.mjs')
  console.log(value1.default)
  const value2 = await import('./test.cjs')
  console.log(value2.default)
  return {
    body: () => 'body'
  }
}())

const { body } = reserve
export { body }
export default reserve
