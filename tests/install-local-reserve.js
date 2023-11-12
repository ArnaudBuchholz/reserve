const { join } = require('path')
const { mkdirSync, writeFileSync } = require('fs')
const root = join(__dirname, '..')
mkdirSync(join(root, 'node_modules/reserve'), { recursive: true })
const reserve = require(join(root, 'package.json'))
reserve.main = join(root, reserve.main)
reserve.types = join(root, reserve.types)
reserve.exports['.'].require = join(root, reserve.exports['.'].require)
reserve.exports['.'].import = join(root, reserve.exports['.'].import)
reserve.bin.reserve = join(root, reserve.bin.reserve)
writeFileSync(join(root, 'node_modules/reserve/package.json'), JSON.stringify(reserve, undefined, 2), { flag: 'w' })
writeFileSync(join(root, 'node_modules/.bin/reserve'), `#!/bin/sh
basedir=$(dirname "$(echo "$0" | sed -e 's,\\\\,/,g')")

case \`uname\` in
    *CYGWIN*|*MINGW*|*MSYS*) basedir=\`cygpath -w "$basedir"\`;;
esac

if [ -x "$basedir/node" ]; then
  exec "$basedir/node"  "$basedir/../../dist/cli.js" "$@"
else 
  exec node  "$basedir/../../dist/cli.js" "$@"
fi`, { flag: 'w' })
writeFileSync(join(root, 'node_modules/.bin/reserve.cmd'), `@ECHO off
GOTO start
:find_dp0
SET dp0=%~dp0
EXIT /b
:start
SETLOCAL
CALL :find_dp0

IF EXIST "%dp0%\\node.exe" (
  SET "_prog=%dp0%\\node.exe"
) ELSE (
  SET "_prog=node"
  SET PATHEXT=%PATHEXT:;.JS;=;%
)

endLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & "%_prog%"  "%dp0%\\..\\..\\dist\\cli.js" %*
`, { flag: 'w' })
