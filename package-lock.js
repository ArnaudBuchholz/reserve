const { join } = require('path')
const { writeFileSync } = require('fs')
const packageLock = require('./package-lock.json')
// remove "version": "file:<project>" that is incompatible with Node.js < 16
Object.values(packageLock.dependencies).forEach(dependency => {
  const { version } = dependency
  if (version.startsWith('file:')) {
    const project = packageLock.packages[version.substring(5)]
    if (project) {
      dependency.version = project.version
    } else {
      console.log(dependency)
      throw new Error(`Missing project for ${version}`)
    }
  }
})
writeFileSync(join(process.cwd(), 'package-lock.json'), JSON.stringify(packageLock, undefined, 2))
