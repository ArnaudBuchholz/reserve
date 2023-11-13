'use strict'

const defaultCwd = process.cwd()
let mockedCwd

process.mockCwd = cwd => {
  mockedCwd = cwd
}

process.cwd = () => mockedCwd || defaultCwd
