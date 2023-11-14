import EventEmitter from 'events'
import { createReadStream, readdir, readFile, stat } from 'fs'
import http from 'http'
import http2 from 'http2'
import https from 'https'
import { networkInterfaces } from 'os'
import { basename, dirname, isAbsolute, join } from 'path'
import { pipeline, Duplex, Readable } from 'stream'
import { promisify } from 'util'
import zlib from 'zlib'
import factory from './core.js'
const reserve = factory({
  EventEmitter,
  createReadStream,
  readdir,
  readFile,
  stat,
  http,
  http2,
  https,
  networkInterfaces,
  basename,
  dirname,
  isAbsolute,
  join,
  pipeline,
  Duplex,
  Readable,
  promisify,
  zlib
})
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
  read,
  send,
  serve
} = reserve
