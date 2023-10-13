const { readFileSync } = require('fs')
const { join, dirname } = require('path')

const src = join(__dirname, '../src')
const stack = [join(src, 'index.js')]
const processed = {}

while (stack.length) {
  const path = stack.shift()
  if (Object.keys(processed).includes(path)) {
    continue
  }
  console.log(`[${path}]`)
  const content = readFileSync(path).toString()
  processed[path] = content
  content.replace(/require\(\s*(.*)\s*\)/g, (_, dependency) => {
    if (dependency.startsWith('\'')) {
      const id = dependency.match(/^'(.*)'$/)[1]
      console.log(id)
      if (!id.startsWith('.')) {
        console.log('module:', id)
      } else {
        stack.push(join(dirname(path), `${id}.js`))
      }
    }
  })
}
