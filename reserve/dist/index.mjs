import { createReadStream, readdir, readFile, stat } from 'fs'
import http from 'http'
import http2 from 'http2'
import https from 'https'
import { Socket } from 'net'
import { networkInterfaces } from 'os'
import { basename, dirname, isAbsolute, join } from 'path'
import { performance } from 'perf_hooks'
import { pipeline, Duplex, Readable } from 'stream'
import { promisify } from 'util'
import zlib from 'zlib'
import factory from './core.js'
const reserve = factory(
  createReadStream, readdir, readFile, stat,
  http,
  http2,
  https,
  Socket,
  networkInterfaces,
  basename, dirname, isAbsolute, join,
  performance,
  pipeline, Duplex, Readable,
  promisify,
  zlib
)
export default reserve
export const {
  Request,
  Response,
  body,
  capture,
  check,
  interpolate,
  log,
  mock,
  punycache,
  read,
  send,
  serve
} = reserve
